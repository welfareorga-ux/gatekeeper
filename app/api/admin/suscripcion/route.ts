import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { withTenant } from "@/lib/tenant"
import { z } from "zod"
import { diasRestantesMesLima, finDeMesLimaTexto, saldoExtraVigente, visitasUsadasEsteMes } from "@/lib/limites-plan"
import { resolverPlanCulqi } from "@/lib/culqi-planes"
import { CLAVES_PERIODO, periodoPorMonto, type PeriodoPro } from "@/lib/periodos-pro"

const CULQI_BASE = "https://api.culqi.com/v2"

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

// GET — devuelve datos de la suscripción activa
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: session.user.condominioId ?? "" },
    select: {
      plan: true, suscripcionEstado: true, culqiSubscriptionId: true, nombre: true,
      visitasMes: true, visitasMesInicio: true, visitasExtra: true, visitasExtraInicio: true,
    },
  })
  if (!condominio) return NextResponse.json({ error: "Condominio no encontrado" }, { status: 404 })

  let currentPeriodEnd: number | null = null
  let periodo: PeriodoPro | null = null
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
      periodo = periodoPorMonto((sub?.plan as { amount?: number } | undefined)?.amount)
    }
  }

  const { visitasMes, visitasMesInicio, visitasExtra, visitasExtraInicio, ...resto } = condominio
  return NextResponse.json({
    ...resto,
    visitasUsadas: visitasUsadasEsteMes({ visitasMes, visitasMesInicio }),
    // Solo el saldo comprado este mes: el de meses anteriores ya venció.
    visitasExtra: saldoExtraVigente({ visitasExtra, visitasExtraInicio }),
    finDeMes: finDeMesLimaTexto(),
    diasRestantesMes: diasRestantesMesLima(),
    currentPeriodEnd,
    periodo,
  })
}

// POST — pasar del plan GRATIS al plan PRO desde el panel
const suscribirSchema = z.object({
  tokenId: z.string().min(1),
  plan: z.literal("PRO"),
  periodo: z.enum(CLAVES_PERIODO).default("mensual"),
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

  const { tokenId, periodo } = result.data

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })
  }

  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  // Obtener datos del admin (su propio usuario) — User tiene RLS → withTenant.
  const adminUser = await withTenant(condominioId, (tx) => tx.user.findUnique({
    where: { id: session.user.id },
    select: { nombre: true, email: true },
  }))
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
    planId = await resolverPlanCulqi(periodo, secretKey)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  let subscription: { id: string }
  try {
    const sRes = await culqiFetch("/recurrent/subscriptions/create", "POST", secretKey, {
      card_id: card.id,
      plan_id: planId,
      tyc: true,
      metadata: { condominioId, periodo },
    }) as { id?: string; user_message?: string; merchant_message?: string }
    if (!sRes.id) throw new Error(sRes.merchant_message ?? sRes.user_message ?? "Error al crear suscripción")
    subscription = sRes as { id: string }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  // 4. Actualizar DB. Si falla, se da de baja la suscripción recién creada para
  // no cobrar un plan que la cuenta no refleja.
  try {
    await prisma.condominio.update({
      where: { id: condominioId },
      data: {
        plan: "PRO",
        suscripcionEstado: "activa",
        culqiSubscriptionId: subscription.id,
      },
    })
  } catch (dbErr) {
    console.error("[suscripcion] Error en DB, cancelando suscripción Culqi:", subscription.id, dbErr)
    await fetch(`${CULQI_BASE}/recurrent/subscriptions/${subscription.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    }).catch((e) => console.error("[suscripcion] No se pudo cancelar en Culqi:", e))
    return NextResponse.json(
      { error: "No pudimos activar el plan y se anuló la suscripción. Intenta de nuevo o escríbenos a soporte@gatekeeper-app.org." },
      { status: 500 },
    )
  }

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

  // Culqi cancela con: DELETE https://api.culqi.com/v2/recurrent/subscriptions/{id}
  // El id va al FINAL del path. El sufijo "/delete" apunta a un endpoint inexistente:
  // Culqi devolvía error, NO se cancelaba el cobro recurrente y la DB quedaba en
  // "cancelada" → el cliente creía haber cancelado pero se le seguía cobrando.
  const res = await fetch(
    `${CULQI_BASE}/recurrent/subscriptions/${condominio.culqiSubscriptionId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${secretKey}` } }
  )
  const culqiRes = await res.json().catch(() => ({})) as {
    object?: string; deleted?: boolean; merchant_message?: string; user_message?: string
  }

  const cancelada = res.ok && (culqiRes?.object === "deleted" || culqiRes?.deleted === true)

  if (!cancelada) {
    // NO marcamos "cancelada": si Culqi no confirmó, la suscripción sigue viva y
    // seguiría cobrando. Devolvemos error para que el cliente reintente o escriba.
    console.error("[Culqi] cancelar suscripción falló:", res.status, JSON.stringify(culqiRes))
    return NextResponse.json(
      {
        error:
          culqiRes?.merchant_message ??
          culqiRes?.user_message ??
          "No se pudo cancelar la suscripción en la pasarela de pago. Vuelve a intentarlo o escríbenos a soporte@gatekeeper-app.org.",
      },
      { status: 502 }
    )
  }

  await prisma.condominio.update({
    where: { id: session.user.condominioId ?? "" },
    data: { suscripcionEstado: "cancelada" },
  })

  return NextResponse.json({ ok: true })
}
