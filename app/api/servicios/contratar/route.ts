import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enviarNotificacionServicioContratado } from "@/lib/email"

const SERVICIOS = {
  onboarding: {
    nombre: "Onboarding y Configuración",
    amount: 5900,
    precioStr: "S/ 59.00",
    description: "Onboarding y Configuración — Gatekeeper",
  },
  capacitacion: {
    nombre: "Capacitación del Personal",
    amount: 2900,
    precioStr: "S/ 29.00",
    description: "Capacitación del Personal — Gatekeeper",
  },
} as const

type TipoServicio = keyof typeof SERVICIOS

const schema = z.object({
  tokenId: z.string().min(1),
  tipo: z.enum(["onboarding", "capacitacion"]),
})

async function culqiCharge(secretKey: string, body: object) {
  const res = await fetch("https://api.culqi.com/v2/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data as { user_message?: string; merchant_message?: string }
    const msg = d.merchant_message ?? d.user_message ?? "Error al procesar el pago"
    console.error("[Culqi] /charges falló:", JSON.stringify(data))
    throw new Error(msg)
  }
  return data as { id: string }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { tokenId, tipo } = result.data
  const servicio = SERVICIOS[tipo as TipoServicio]

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })
  }

  try {
    await culqiCharge(secretKey, {
      amount: servicio.amount,
      currency_code: "PEN",
      email: session.user.email,
      source_id: tokenId,
      capture: true,
      description: servicio.description,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // Obtener nombre del condominio del admin para el email de notificación
  let condominioNombre = "—"
  if (session.user.condominioId) {
    const condo = await prisma.condominio.findUnique({
      where: { id: session.user.condominioId },
      select: { nombre: true },
    })
    if (condo) condominioNombre = condo.nombre
  }

  void enviarNotificacionServicioContratado({
    nombre: session.user.nombre,
    email: session.user.email,
    servicioNombre: servicio.nombre,
    precio: servicio.precioStr,
    condominioNombre,
  })

  return NextResponse.json({ ok: true })
}
