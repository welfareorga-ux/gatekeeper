import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const condominios = await prisma.condominio.findMany({
    include: {
      _count: { select: { usuarios: true, visitas: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(condominios)
}
