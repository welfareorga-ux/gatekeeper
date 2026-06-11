import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const turnoActivo = await db.turnoVigilante.findFirst({
    where: { vigilanteId: session.user.id, activo: true },
  })

  if (!turnoActivo) {
    return NextResponse.json({ error: "No hay turno activo" }, { status: 404 })
  }

  const ahora = new Date()
  const turno = await db.turnoVigilante.update({
    where: { id: turnoActivo.id },
    data: { activo: false, horaFinTurno: ahora },
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "FINALIZAR_TURNO",
      detalle: `Turno finalizado: ${turno.id}`,
    },
  })

  return NextResponse.json(turno)
}
