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

  const visitas = await prisma.visita.findMany({
    where: { condominioId, createdAt: { gte: fechaDesde } },
    select: { createdAt: true, estado: true },
  })

  const buckets: { fecha: string; total: number; ingresados: number; cancelados: number }[] = []

  for (let i = 0; i < dias; i++) {
    const d = new Date(fechaDesde)
    d.setDate(d.getDate() + i)
    const dStr = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })

    const del_dia = visitas.filter((v) => {
      const vd = new Date(v.createdAt)
      return (
        vd.getFullYear() === d.getFullYear() &&
        vd.getMonth() === d.getMonth() &&
        vd.getDate() === d.getDate()
      )
    })

    buckets.push({
      fecha: dStr,
      total: del_dia.length,
      ingresados: del_dia.filter((v) => v.estado === "INGRESADO" || v.estado === "SALIDO").length,
      cancelados: del_dia.filter((v) => v.estado === "CANCELADO").length,
    })
  }

  return NextResponse.json(buckets)
}
