import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  placa: z.string().min(1),
  descripcion: z.string().max(500).optional(),
  nombreVisitante: z.string().max(100).optional(),
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

  const { placa, descripcion, nombreVisitante } = parsed.data

  await prisma.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "EMERGENCIA_INGRESO",
      detalle: JSON.stringify({
        condominioId,
        placa,
        nombreVisitante: nombreVisitante ?? "Desconocido",
        descripcion: descripcion ?? "Sin descripción",
        vigilante: session.user.nombre,
        timestamp: new Date().toISOString(),
      }),
    },
  })

  return NextResponse.json({ ok: true, mensaje: "Registrado. El administrador será notificado." }, { status: 201 })
}
