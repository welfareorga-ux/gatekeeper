import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
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

  const body = await req.json()

  if (params.id === session.user.id && body.activo === false) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 })
  }

  const result = actualizarSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  return withTenant(condominioId, async (tx) => {
    // findFirst (con tenant + RLS) garantiza que el usuario sea del condominio.
    const target = await tx.user.findFirst({ where: { id: params.id }, select: { id: true } })
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const usuario = await tx.user.update({
      where: { id: params.id },
      data: result.data,
      select: { id: true, nombre: true, email: true, rol: true, activo: true, telefono: true, direccion: true },
    })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "ACTUALIZAR_USUARIO",
        detalle: JSON.stringify({ targetId: params.id, cambios: result.data }),
      },
    })

    return NextResponse.json(usuario)
  })
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

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  return withTenant(condominioId, async (tx) => {
    const target = await tx.user.findFirst({
      where: { id: params.id },
      select: { id: true, rol: true, nombre: true },
    })
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    if (target.rol === Rol.ADMIN) {
      return NextResponse.json({ error: "No se puede eliminar un administrador. Desactívalo en su lugar." }, { status: 400 })
    }

    // Cascada dentro de la MISMA transacción de withTenant (no hace falta otro
    // $transaction). Los deleteMany sobre modelos tenant quedan acotados por RLS.
    await tx.registroIngreso.updateMany({ where: { vigilanteIngresoId: params.id }, data: { vigilanteIngresoId: null } })
    await tx.registroIngreso.updateMany({ where: { vigilanteSalidaId: params.id }, data: { vigilanteSalidaId: null } })

    await tx.plantillaVisita.deleteMany({ where: { residenteId: params.id } })

    const visitaIds = (await tx.visita.findMany({ where: { residenteId: params.id }, select: { id: true } })).map((v) => v.id)
    if (visitaIds.length > 0) {
      await tx.registroIngreso.deleteMany({ where: { visitaId: { in: visitaIds } } })
    }

    await tx.visita.deleteMany({ where: { residenteId: params.id } })
    await tx.turnoVigilante.deleteMany({ where: { vigilanteId: params.id } })
    await tx.logActividad.deleteMany({ where: { userId: params.id } })
    await tx.user.delete({ where: { id: params.id } })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "ELIMINAR_USUARIO",
        detalle: JSON.stringify({ eliminadoId: params.id, nombre: target.nombre, rol: target.rol }),
      },
    })

    return NextResponse.json({ ok: true })
  })
}
