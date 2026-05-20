import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const type: string = body?.type ?? ""
  const obj = body?.data?.object ?? {}

  // Culqi envía el subscription_id en distintos campos según el tipo de evento
  const subscriptionId: string =
    obj.id?.startsWith("sbn_") ? obj.id :
    obj.subscription_id ?? obj.source_id ?? ""

  if (!subscriptionId) return NextResponse.json({ ok: true })

  if (type.includes("cancel") || type.includes("expir")) {
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "cancelada", activo: false },
    })
  } else if (type.includes("fail")) {
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "fallida" },
    })
  } else if (type.includes("success") || type.includes("paid")) {
    await prisma.condominio.updateMany({
      where: { culqiSubscriptionId: subscriptionId },
      data: { suscripcionEstado: "activa", activo: true },
    })
  }

  return NextResponse.json({ ok: true })
}
