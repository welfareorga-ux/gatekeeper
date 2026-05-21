import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CULQI_BASE = "https://api.culqi.com/v2"

async function culqiFetch(path: string, method: string, secretKey: string) {
  const res = await fetch(`${CULQI_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  return res.json().catch(() => ({}))
}

// GET — devuelve datos de la suscripción activa
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: session.user.condominioId },
    select: { plan: true, suscripcionEstado: true, culqiSubscriptionId: true, nombre: true },
  })
  if (!condominio) return NextResponse.json({ error: "Condominio no encontrado" }, { status: 404 })

  let currentPeriodEnd: number | null = null
  if (condominio.culqiSubscriptionId) {
    const secretKey = process.env.CULQI_SECRET_KEY
    if (secretKey) {
      const sub = await culqiFetch(
        `/recurrent/subscriptions/${condominio.culqiSubscriptionId}`,
        "GET",
        secretKey
      ) as Record<string, unknown>
      currentPeriodEnd = (
        sub?.current_period_end ??
        sub?.billing_date ??
        sub?.next_billing_date ??
        sub?.cancel_at ??
        null
      ) as number | null
    }
  }

  return NextResponse.json({ ...condominio, currentPeriodEnd })
}

// DELETE — cancela la suscripción en Culqi y actualiza la DB
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })

  const condominio = await prisma.condominio.findUnique({
    where: { id: session.user.condominioId },
    select: { culqiSubscriptionId: true, suscripcionEstado: true },
  })

  if (!condominio?.culqiSubscriptionId) {
    return NextResponse.json({ error: "No hay suscripción activa" }, { status: 400 })
  }

  if (condominio.suscripcionEstado === "cancelada") {
    return NextResponse.json({ error: "La suscripción ya está cancelada" }, { status: 400 })
  }

  // Cancelar en Culqi
  const culqiRes = await culqiFetch(
    `/recurrent/subscriptions/${condominio.culqiSubscriptionId}/delete`,
    "DELETE",
    secretKey
  ) as { object?: string }

  if (culqiRes?.object !== "deleted") {
    console.error("[Culqi] cancelar suscripción:", JSON.stringify(culqiRes))
    // Aunque Culqi falle, marcamos como cancelada en DB de todas formas
  }

  await prisma.condominio.update({
    where: { id: session.user.condominioId },
    data: { suscripcionEstado: "cancelada" },
  })

  return NextResponse.json({ ok: true })
}
