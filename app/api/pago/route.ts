import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Códigos legibles tal como están en CulqiPanel — se resuelven a IDs reales en runtime
const PLAN_CODES: Record<string, string> = {
  BASICO: "plan-basico-2026",
  ESTANDAR: "plan-estandar-2026",
  PREMIUM: "plan-premium-2026",
}

async function resolverPlanId(planCode: string, secretKey: string): Promise<string> {
  const res = await fetch("https://api.culqi.com/v2/recurrent/plans?limit=20", {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json().catch(() => ({}))
  console.log("[Culqi] GET /recurrent/plans status:", res.status, "body:", JSON.stringify(data))

  const planes = (data as { data?: Record<string, unknown>[] })?.data ?? []
  const plan = planes.find((p) =>
    Object.values(p).some((v) => v === planCode)
  )
  if (!plan) {
    const keys = planes[0] ? Object.keys(planes[0]) : []
    const samples = planes.slice(0, 3).map((p) => JSON.stringify(p))
    throw new Error(`Plan '${planCode}' no encontrado. Campos disponibles: ${keys.join(",")} | Planes: ${samples.join(" | ")}`)
  }
  return plan.id as string
}

const schema = z.object({
  tokenId: z.string().min(1),
  plan: z.enum(["BASICO", "ESTANDAR", "PREMIUM"]),
  amount: z.number().int().positive(),
  nombreCondominio: z.string().min(3).max(100),
  direccion: z.string().min(5).max(200),
  adminNombre: z.string().min(3).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
})

async function culqiPost(endpoint: string, secretKey: string, body: object) {
  const res = await fetch(`https://api.culqi.com/v2${endpoint}`, {
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
    const msg = d.merchant_message ?? d.user_message ?? `Error en ${endpoint}`
    console.error(`[Culqi] ${endpoint} falló:`, JSON.stringify(data))
    throw new Error(`[${endpoint}] ${msg}`)
  }
  return data as { id: string }
}

export async function POST(req: Request) {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { tokenId, plan, nombreCondominio, direccion, adminNombre, adminEmail, adminPassword } =
    result.data

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })
  }

  const existe = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } })
  if (existe) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 })
  }

  // 1. Obtener o crear Customer en Culqi
  const nameParts = adminNombre.trim().split(" ")
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(" ") || "-"

  let customer: { id: string }
  try {
    // Buscar si ya existe un customer con ese email en Culqi
    const searchRes = await fetch(
      `https://api.culqi.com/v2/customers?email=${encodeURIComponent(adminEmail)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )
    const searchData = await searchRes.json().catch(() => ({})) as { data?: { id: string }[] }
    const existing = searchData?.data?.[0]

    if (existing?.id) {
      customer = existing
    } else {
      customer = await culqiPost("/customers", secretKey, {
        first_name: firstName,
        last_name: lastName,
        email: adminEmail,
        address: direccion,
        address_city: "Lima",
        country_code: "PE",
        phone_number: "999999999",
        metadata: { condominio: nombreCondominio },
      })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 2. Crear Card (asocia token al customer)
  let card: { id: string }
  try {
    card = await culqiPost("/cards", secretKey, {
      customer_id: customer.id,
      token_id: tokenId,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 3. Crear Subscription (primer cobro ocurre automáticamente)
  let planId: string
  try {
    planId = await resolverPlanId(PLAN_CODES[plan], secretKey)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  let subscription: { id: string }
  try {
    subscription = await culqiPost("/recurrent/subscriptions/create", secretKey, {
      card_id: card.id,
      plan_id: planId,
      tyc: true,
      metadata: { condominio: nombreCondominio, plan },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 4. Crear condominio + admin en DB
  const hash = await bcrypt.hash(adminPassword, 12)

  await prisma.$transaction(async (tx) => {
    const condominio = await tx.condominio.create({
      data: {
        nombre: nombreCondominio,
        direccion,
        plan,
        culqiSubscriptionId: subscription.id,
        suscripcionEstado: "activa",
      },
    })
    const admin = await tx.user.create({
      data: {
        nombre: adminNombre,
        email: adminEmail.toLowerCase(),
        password: hash,
        rol: "ADMIN",
        condominioId: condominio.id,
      },
    })
    await tx.logActividad.create({
      data: {
        userId: admin.id,
        accion: "REGISTRO_CONDOMINIO",
        detalle: JSON.stringify({ condominio: nombreCondominio, plan, subscriptionId: subscription.id }),
      },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
