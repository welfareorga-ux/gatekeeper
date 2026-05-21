import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enviarEmailCobroFallido } from "@/lib/email"

const PLAN_LABEL: Record<string, string> = {
  BASICO: "Básico",
  ESTANDAR: "Estándar",
  PREMIUM: "Premium",
}

function verificarToken(req: Request): boolean {
  const secret = process.env.CULQI_WEBHOOK_SECRET
  if (!secret) {
    // Sin secret configurado: loguear advertencia pero no bloquear
    // (permite desarrollo/testing sin configuración extra)
    console.warn("[webhook/culqi] CULQI_WEBHOOK_SECRET no configurado — verificación omitida")
    return true
  }

  // Culqi envía el token en el header Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader

  if (token !== secret) {
    console.warn("[webhook/culqi] Token inválido recibido:", token.slice(0, 8) + "…")
    return false
  }

  return true
}

export async function POST(req: Request) {
  if (!verificarToken(req)) {
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

  if (type.includes("cancel") || type.includes("expir")) {
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "cancelada", activo: false },
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
      const admin = await prisma.user.findFirst({
        where: { condominioId: condominio.id, rol: "ADMIN" },
        select: { nombre: true, email: true },
      })
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
