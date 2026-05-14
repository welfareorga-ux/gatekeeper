import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(7, parseInt(searchParams.get("dias") ?? "30")))

  const fechaDesde = new Date()
  fechaDesde.setDate(fechaDesde.getDate() - (dias - 1))
  fechaDesde.setHours(0, 0, 0, 0)

  const grouped = await prisma.visita.groupBy({
    by: ["residenteId"],
    where: { condominioId, createdAt: { gte: fechaDesde } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  })

  const userIds = grouped.map((g) => g.residenteId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, condominioId },
    select: { id: true, nombre: true, direccion: true },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  const data = grouped.map((g) => {
    const u = userMap.get(g.residenteId)
    return {
      nombre: u?.nombre ?? "Desconocido",
      direccion: u?.direccion ?? "",
      total: g._count.id,
    }
  })

  return NextResponse.json(data)
}
