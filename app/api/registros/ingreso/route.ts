import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { EstadoVisita } from "@prisma/client"

const schema = z.object({
  visitaId: z.string().min(1),
  vehiculoId: z.string().min(1),
  notasVigilante: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 422 })
  }

  const { visitaId, vehiculoId, notasVigilante } = parsed.data

  const visita = await prisma.visita.findFirst({
    where: { id: visitaId, condominioId },
    select: { estado: true, vehiculos: { select: { id: true } } },
  })

  if (!visita) return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 })
  if (visita.estado !== EstadoVisita.PENDIENTE) {
    return NextResponse.json(
      { error: `La visita está en estado ${visita.estado}. Solo se puede registrar ingreso si está PENDIENTE.` },
      { status: 409 }
    )
  }

  const vehiculoPertenece = visita.vehiculos.some((v) => v.id === vehiculoId)
  if (!vehiculoPertenece) {
    return NextResponse.json({ error: "El vehículo no pertenece a esta visita" }, { status: 400 })
  }

  const registro = await prisma.$transaction(async (tx) => {
    const r = await tx.registroIngreso.create({
      data: {
        visitaId,
        vehiculoId,
        vigilanteIngresoId: session.user.id,
        fechaHoraIngreso: new Date(),
        notasVigilante: notasVigilante ?? null,
      },
    })

    await tx.visita.update({
      where: { id: visitaId },
      data: { estado: EstadoVisita.INGRESADO },
    })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "REGISTRAR_INGRESO",
        detalle: `Ingreso registrado — Visita: ${visitaId} | Vehículo: ${vehiculoId}`,
      },
    })

    return r
  })

  return NextResponse.json(registro, { status: 201 })
}
