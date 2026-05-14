import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  await prisma.turnoVigilante.updateMany({
    where: { vigilanteId: session.user.id, activo: true },
    data: { activo: false, horaFinTurno: new Date() },
  })

  const turno = await prisma.turnoVigilante.create({
    data: {
      vigilanteId: session.user.id,
      condominioId,
      horaInicioTurno: new Date(),
      activo: true,
    },
  })

  await prisma.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "INICIAR_TURNO",
      detalle: `Turno iniciado: ${turno.id}`,
    },
  })

  return NextResponse.json(turno, { status: 201 })
}
