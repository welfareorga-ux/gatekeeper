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

  const vehiculos = await prisma.vehiculo.findMany({
    where: { visita: { condominioId, createdAt: { gte: fechaDesde } } },
    select: {
      placa: true,
      marca: true,
      modelo: true,
      color: true,
      visita: {
        select: {
          nombreVisitante: true,
          residente: { select: { nombre: true, direccion: true } },
        },
      },
    },
  })

  const placaMap = new Map<
    string,
    { placa: string; marca: string | null; modelo: string | null; color: string | null; total: number; visitantes: Set<string>; residentes: Set<string> }
  >()

  for (const v of vehiculos) {
    if (!v.placa) continue
    const existing = placaMap.get(v.placa)
    if (existing) {
      existing.total++
      existing.visitantes.add(v.visita.nombreVisitante)
      existing.residentes.add(v.visita.residente.nombre)
    } else {
      placaMap.set(v.placa, {
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        color: v.color,
        total: 1,
        visitantes: new Set([v.visita.nombreVisitante]),
        residentes: new Set([v.visita.residente.nombre]),
      })
    }
  }

  const data = Array.from(placaMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .map((v) => ({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      color: v.color,
      total: v.total,
      visitantes: Array.from(v.visitantes).join(", "),
      residentes: Array.from(v.residentes).join(", "),
    }))

  return NextResponse.json(data)
}
