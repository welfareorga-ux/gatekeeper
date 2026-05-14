import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const dentro = await prisma.registroIngreso.findMany({
    where: { fechaHoraSalida: null, visita: { condominioId } },
    include: {
      vehiculo: true,
      visita: {
        include: {
          residente: { select: { nombre: true, direccion: true } },
        },
      },
      vigilanteIngreso: { select: { nombre: true } },
    },
    orderBy: { fechaHoraIngreso: "asc" },
  })

  return NextResponse.json(dentro)
}
