import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runAsAdmin } from "@/lib/tenant"
import { enviarEmailCobroFallido } from "@/lib/email"

const PLAN_LABEL: Record<string, string> = {
  BASICO: "Básico",
  ESTANDAR: "Estándar",
  PREMIUM: "Premium",
}

function verificarAuth(req: Request): boolean {
  const secret = process.env.CULQI_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[webhook/culqi] CULQI_WEBHOOK_SECRET no configurado — verificación omitida")
    return true
  }

  // Culqi usa HTTP Basic Auth: Authorization: Basic base64(usuario:contraseña)
  const authHeader = req.headers.get("authorization") ?? ""
  if (!authHeader.startsWith("Basic ")) {
    console.warn("[webhook/culqi] Header Authorization ausente o no es Basic Auth")
    return false
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8")
  const password = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded

  if (password !== secret) {
    console.warn("[webhook/culqi] Contraseña inválida en Basic Auth")
    return false
  }

  return true
}

export async function POST(req: Request) {
  if (!verificarAuth(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  // Validación estructural mínima: debe tener type y data.object
  const type: string = body?.type ?? ""
  const obj = body?.data?.object ?? {}
  if (!type || typeof type !== "string") {
    console.warn("[webhook/culqi] Payload inválido:", JSON.stringify(body).slice(0, 200))
    return NextResponse.json({ ok: true })
  }

  const subscriptionId: string =
    obj.id?.startsWith("sbn_") ? obj.id :
    obj.subscription_id ?? obj.source_id ?? ""

  if (!subscriptionId) return NextResponse.json({ ok: true })

  console.log(`[webhook/culqi] Evento: ${type} | suscripción: ${subscriptionId}`)

  if (type.includes("cancel")) {
    // Cancelada por el usuario: mantiene acceso hasta fin del período pagado
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "cancelada" },
    })
  } else if (type.includes("expir")) {
    // Período vencido: cortar acceso
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "vencida", activo: false },
    })
  } else if (type.includes("fail")) {
    const condominio = await prisma.condominio.findFirst({
      where: { culqiSubscriptionId: subscriptionId },
      select: { id: true, nombre: true, plan: true },
    })

    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "vencida", activo: false },
    })

    if (condominio) {
      // User tiene RLS; el webhook no tiene contexto de tenant → bypass.
      const admin = await runAsAdmin((tx) => tx.user.findFirst({
        where: { condominioId: condominio.id, rol: "ADMIN" },
        select: { nombre: true, email: true },
      }))
      if (admin) {
        await enviarEmailCobroFallido({
          emailAdmin: admin.email,
          nombreAdmin: admin.nombre,
          condominioNombre: condominio.nombre,
          planLabel: PLAN_LABEL[condominio.plan] ?? condominio.plan,
        })
      }
    }
  } else if (type.includes("success") || type.includes("paid")) {
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "activa", activo: true },
    })
  }

  return NextResponse.json({ ok: true })
}
