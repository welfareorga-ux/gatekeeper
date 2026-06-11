import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(7, parseInt(searchParams.get("dias") ?? "30")))

  const fechaDesde = new Date()
  fechaDesde.setDate(fechaDesde.getDate() - (dias - 1))
  fechaDesde.setHours(0, 0, 0, 0)

  const grouped = await db.visita.groupBy({
    by: ["residenteId"],
    where: { createdAt: { gte: fechaDesde } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  })

  const userIds = grouped.map((g) => g.residenteId)
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
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
