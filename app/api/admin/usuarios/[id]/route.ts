import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"
import { Rol } from "@prisma/client"

const actualizarSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100).optional(),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const body = await req.json()

  if (params.id === session.user.id && body.activo === false) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 })
  }

  const result = actualizarSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Ensure target user belongs to the same condominio (forTenant inyecta condominioId)
  const target = await db.user.findFirst({ where: { id: params.id }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const usuario = await db.user.update({
    where: { id: params.id },
    data: result.data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, telefono: true, direccion: true },
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "ACTUALIZAR_USUARIO",
      detalle: JSON.stringify({ targetId: params.id, cambios: result.data }),
    },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  const target = await db.user.findFirst({
    where: { id: params.id },
    select: { id: true, rol: true, nombre: true },
  })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  if (target.rol === Rol.ADMIN) {
    return NextResponse.json({ error: "No se puede eliminar un administrador. Desactívalo en su lugar." }, { status: 400 })
  }

  await db.$transaction(async (tx) => {
    // Nullificar referencias de vigilante en registros de ingreso/salida
    await tx.registroIngreso.updateMany({ where: { vigilanteIngresoId: params.id }, data: { vigilanteIngresoId: null } })
    await tx.registroIngreso.updateMany({ where: { vigilanteSalidaId: params.id }, data: { vigilanteSalidaId: null } })

    // Eliminar plantillas del residente
    await tx.plantillaVisita.deleteMany({ where: { residenteId: params.id } })

    // Eliminar registros de ingreso de las visitas del residente
    const visitaIds = (await tx.visita.findMany({ where: { residenteId: params.id }, select: { id: true } })).map((v) => v.id)
    if (visitaIds.length > 0) {
      await tx.registroIngreso.deleteMany({ where: { visitaId: { in: visitaIds } } })
    }

    // Eliminar visitas (cascade elimina vehículos)
    await tx.visita.deleteMany({ where: { residenteId: params.id } })

    // Eliminar turnos del vigilante
    await tx.turnoVigilante.deleteMany({ where: { vigilanteId: params.id } })

    // Eliminar logs de actividad
    await tx.logActividad.deleteMany({ where: { userId: params.id } })

    // Eliminar usuario
    await tx.user.delete({ where: { id: params.id } })
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "ELIMINAR_USUARIO",
      detalle: JSON.stringify({ eliminadoId: params.id, nombre: target.nombre, rol: target.rol }),
    },
  })

  return NextResponse.json({ ok: true })
}
