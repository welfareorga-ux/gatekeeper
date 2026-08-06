import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { runAsAdmin } from "@/lib/tenant"

const schema = z.object({
  activo: z.boolean().optional(),
  plan: z.enum(["GRATIS", "PRO"]).optional(),
  nombre: z.string().min(3).optional(),
  ruc: z.string().optional(),
  telefono: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const condominio = await prisma.condominio.update({
    where: { id: params.id },
    data: result.data,
  })

  return NextResponse.json(condominio)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Borrado TOTAL del condominio: sus usuarios y TODOS sus datos. Cross-tenant
  // con bypass (runAsAdmin). Orden de cascada para respetar las claves foráneas
  // (las relaciones a User/Visita son Restrict; Vehiculo cae en cascada de Visita).
  return runAsAdmin(async (tx) => {
    const condo = await tx.condominio.findUnique({
      where: { id: params.id },
      select: { id: true, nombre: true },
    })
    if (!condo) return NextResponse.json({ error: "Condominio no encontrado" }, { status: 404 })

    const userIds = (await tx.user.findMany({ where: { condominioId: params.id }, select: { id: true } })).map((u) => u.id)
    const visitaIds = (await tx.visita.findMany({
      where: { OR: [{ condominioId: params.id }, { residenteId: { in: userIds } }] },
      select: { id: true },
    })).map((v) => v.id)

    if (visitaIds.length > 0) {
      await tx.registroIngreso.deleteMany({ where: { visitaId: { in: visitaIds } } })
      await tx.vehiculo.deleteMany({ where: { visitaId: { in: visitaIds } } })
    }
    // Registros de OTROS condominios donde un vigilante de éste actuó: soltar la referencia.
    if (userIds.length > 0) {
      await tx.registroIngreso.updateMany({ where: { vigilanteIngresoId: { in: userIds } }, data: { vigilanteIngresoId: null } })
      await tx.registroIngreso.updateMany({ where: { vigilanteSalidaId: { in: userIds } }, data: { vigilanteSalidaId: null } })
    }

    await tx.plantillaVisita.deleteMany({ where: { OR: [{ condominioId: params.id }, { residenteId: { in: userIds } }] } })
    await tx.turnoVigilante.deleteMany({ where: { OR: [{ condominioId: params.id }, { vigilanteId: { in: userIds } }] } })
    await tx.logActividad.deleteMany({ where: { userId: { in: userIds } } })
    if (visitaIds.length > 0) await tx.visita.deleteMany({ where: { id: { in: visitaIds } } })
    await tx.user.deleteMany({ where: { condominioId: params.id } })
    await tx.condominio.delete({ where: { id: params.id } })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "SUPERADMIN_ELIMINAR_CONDOMINIO",
        detalle: JSON.stringify({ condominioId: params.id, nombre: condo.nombre, usuarios: userIds.length, visitas: visitaIds.length }),
      },
    })

    return NextResponse.json({ ok: true, usuarios: userIds.length, visitas: visitaIds.length })
  })
}
