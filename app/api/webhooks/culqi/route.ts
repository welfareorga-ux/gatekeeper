import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { degradarAGratis } from "@/lib/degradar-plan"

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

  // Las suscripciones recurrentes de Culqi tienen id con prefijo "sxn"
  // (antes se buscaba "sbn_", que nunca coincide → los eventos de cancelación/
  //  cobro desde Culqi no actualizaban el condominio).
  const subscriptionId: string =
    obj.id?.startsWith("sxn") ? obj.id :
    obj.subscription_id ?? obj.source_id ?? ""

  if (!subscriptionId) return NextResponse.json({ ok: true })

  console.log(`[webhook/culqi] Evento: ${type} | suscripción: ${subscriptionId}`)

  if (type.includes("cancel")) {
    // Cancelada por el usuario: mantiene acceso hasta fin del período pagado
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "cancelada" },
    })
  } else if (type.includes("expir") || type.includes("fail")) {
    // Dejó de pagar (periodo vencido o cobro fallido): la organización NO se
    // bloquea, pasa a Gratis y se retiran los usuarios que exceden el plan
    // (se conservan los más antiguos). Ver lib/degradar-plan.ts.
    const condominio = await prisma.condominio.findFirst({
      where: { culqiSubscriptionId: subscriptionId },
      select: { id: true },
    })
    if (condominio) {
      await degradarAGratis(condominio.id, `webhook ${type}`)
    }
  } else if (type.includes("success") || type.includes("paid")) {
    const { count } = await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "activa", activo: true },
    })
    if (count === 0) {
      // Una organización pasada a Gratis deja de tener suscripción asociada. Si
      // aun así llega un cobro, hay que revisarlo y devolverlo a mano.
      console.error("[webhook/culqi] Cobro de una suscripción sin organización asociada:", subscriptionId)
    }
  }

  return NextResponse.json({ ok: true })
}
