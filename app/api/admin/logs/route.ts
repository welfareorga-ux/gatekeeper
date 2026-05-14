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
  const accion = searchParams.get("accion") ?? ""
  const userId = searchParams.get("userId") ?? ""
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 50

  const where = {
    user: { condominioId },
    ...(accion ? { accion: { contains: accion, mode: "insensitive" as const } } : {}),
    ...(userId ? { userId } : {}),
    ...((desde || hasta)
      ? {
          timestamp: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.logActividad.findMany({
      where,
      include: { user: { select: { nombre: true, rol: true } } },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.logActividad.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
