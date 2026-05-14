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

  const registros = await prisma.registroIngreso.findMany({
    where: {
      fechaHoraSalida: { not: null },
      fechaHoraIngreso: { gte: fechaDesde },
      visita: { condominioId },
    },
    select: { fechaHoraIngreso: true, fechaHoraSalida: true },
  })

  const buckets: { fecha: string; promedio: number; cantidad: number }[] = []

  for (let i = 0; i < dias; i++) {
    const d = new Date(fechaDesde)
    d.setDate(d.getDate() + i)
    const dStr = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })

    const del_dia = registros.filter((r) => {
      const rd = new Date(r.fechaHoraIngreso)
      return (
        rd.getFullYear() === d.getFullYear() &&
        rd.getMonth() === d.getMonth() &&
        rd.getDate() === d.getDate()
      )
    })

    const promedio =
      del_dia.length === 0
        ? 0
        : Math.round(
            del_dia.reduce((acc, r) => {
              const ms = new Date(r.fechaHoraSalida!).getTime() - new Date(r.fechaHoraIngreso).getTime()
              return acc + ms / 60000
            }, 0) / del_dia.length
          )

    buckets.push({ fecha: dStr, promedio, cantidad: del_dia.length })
  }

  return NextResponse.json(buckets)
}
