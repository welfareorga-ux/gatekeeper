import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { EstadoVisita } from "@prisma/client"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const visita = await db.visita.findFirst({
    where: { id: params.id },
    select: { id: true, residenteId: true, estado: true },
  })

  if (!visita) return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 })

  if (session.user.rol !== "ADMIN" && visita.residenteId !== session.user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  if (visita.estado !== EstadoVisita.PENDIENTE) {
    return NextResponse.json(
      { error: `No se puede cancelar una visita en estado ${visita.estado}` },
      { status: 409 }
    )
  }

  const actualizada = await db.visita.update({
    where: { id: params.id },
    data: { estado: EstadoVisita.CANCELADO },
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "CANCELAR_VISITA",
      detalle: `Visita ${params.id} cancelada`,
    },
  })

  return NextResponse.json(actualizada)
}
