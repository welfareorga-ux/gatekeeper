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

  await db.turnoVigilante.updateMany({
    where: { vigilanteId: session.user.id, activo: true },
    data: { activo: false, horaFinTurno: new Date() },
  })

  const turno = await db.turnoVigilante.create({
    data: {
      vigilanteId: session.user.id,
      horaInicioTurno: new Date(),
      activo: true,
    },
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "INICIAR_TURNO",
      detalle: `Turno iniciado: ${turno.id}`,
    },
  })

  return NextResponse.json(turno, { status: 201 })
}
