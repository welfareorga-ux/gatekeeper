import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CULQI_BASE = "https://api.culqi.com/v2"

const PLAN_CODES: Record<string, string> = {
  BASICO: "plan-basico-2026",
  ESTANDAR: "plan-estandar-2026",
  PREMIUM: "plan-premium-2026",
}

async function culqiFetch(path: string, method: string, secretKey: string, body?: object) {
  const res = await fetch(`${CULQI_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json().catch(() => ({}))
}

async function resolverPlanId(planCode: string, secretKey: string): Promise<string> {
  const data = await culqiFetch("/recurrent/plans?limit=20", "GET", secretKey) as { data?: Record<string, unknown>[] }
  const plan = (data?.data ?? []).find((p) => Object.values(p).some((v) => v === planCode))
  if (!plan) throw new Error(`Plan '${planCode}' no encontrado en Culqi.`)
  return plan.id as string
}

// GET — devuelve datos de la suscripción activa
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: session.user.condominioId ?? "" },
    select: { plan: true, suscripcionEstado: true, culqiSubscriptionId: true, nombre: true, trialEndsAt: true },
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

  return NextResponse.json({
    ...condominio,
    trialEndsAt: condominio.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd,
  })
}

// POST — suscribirse a un plan desde dentro del app (trial o inactivo)
const suscribirSchema = z.object({
  tokenId: z.string().min(1),
  plan: z.enum(["BASICO", "ESTANDAR", "PREMIUM"]),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const result = suscribirSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { tokenId, plan } = result.data

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })
  }

  // Obtener datos del admin y condominio
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nombre: true, email: true },
  })
  if (!adminUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const nameParts = adminUser.nombre.trim().split(" ")
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(" ") || "-"

  // 1. Obtener o crear Customer en Culqi
  let customer: { id: string }
  try {
    const searchRes = await fetch(
      `https://api.culqi.com/v2/customers?email=${encodeURIComponent(adminUser.email)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )
    const searchData = await searchRes.json().catch(() => ({})) as { data?: { id: string }[] }
    const existing = searchData?.data?.[0]

    if (existing?.id) {
      customer = existing
    } else {
      const cRes = await culqiFetch("/customers", "POST", secretKey, {
        first_name: firstName,
        last_name: lastName,
        email: adminUser.email,
        address: "Lima",
        address_city: "Lima",
        country_code: "PE",
        phone_number: "999999999",
      }) as { id?: string; user_message?: string; merchant_message?: string }
      if (!cRes.id) throw new Error(cRes.merchant_message ?? cRes.user_message ?? "Error al crear cliente Culqi")
      customer = cRes as { id: string }
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 2. Crear Card
  let card: { id: string }
  try {
    const cRes = await culqiFetch("/cards", "POST", secretKey, {
      customer_id: customer.id,
      token_id: tokenId,
    }) as { id?: string; user_message?: string; merchant_message?: string }
    if (!cRes.id) throw new Error(cRes.merchant_message ?? cRes.user_message ?? "Error al registrar tarjeta")
    card = cRes as { id: string }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 3. Crear Subscription
  let planId: string
  try {
    planId = await resolverPlanId(PLAN_CODES[plan], secretKey)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  let subscription: { id: string }
  try {
    const sRes = await culqiFetch("/recurrent/subscriptions/create", "POST", secretKey, {
      card_id: card.id,
      plan_id: planId,
      tyc: true,
    }) as { id?: string; user_message?: string; merchant_message?: string }
    if (!sRes.id) throw new Error(sRes.merchant_message ?? sRes.user_message ?? "Error al crear suscripción")
    subscription = sRes as { id: string }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 4. Actualizar DB
  await prisma.condominio.update({
    where: { id: session.user.condominioId ?? "" },
    data: {
      plan: plan as "BASICO" | "ESTANDAR" | "PREMIUM",
      suscripcionEstado: "activa",
      culqiSubscriptionId: subscription.id,
    },
  })

  return NextResponse.json({ ok: true })
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
    where: { id: session.user.condominioId ?? "" },
    select: { culqiSubscriptionId: true, suscripcionEstado: true },
  })

  if (!condominio?.culqiSubscriptionId) {
    return NextResponse.json({ error: "No hay suscripción activa" }, { status: 400 })
  }

  if (condominio.suscripcionEstado === "cancelada") {
    return NextResponse.json({ error: "La suscripción ya está cancelada" }, { status: 400 })
  }

  const culqiRes = await culqiFetch(
    `/recurrent/subscriptions/${condominio.culqiSubscriptionId}/delete`,
    "DELETE",
    secretKey
  ) as { object?: string }

  if (culqiRes?.object !== "deleted") {
    console.error("[Culqi] cancelar suscripción:", JSON.stringify(culqiRes))
  }

  await prisma.condominio.update({
    where: { id: session.user.condominioId ?? "" },
    data: { suscripcionEstado: "cancelada" },
  })

  return NextResponse.json({ ok: true })
}
