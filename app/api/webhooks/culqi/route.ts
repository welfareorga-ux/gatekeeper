import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enviarEmailCobroFallido } from "@/lib/email"

const PLAN_LABEL: Record<string, string> = {
  BASICO: "Básico",
  ESTANDAR: "Estándar",
  PREMIUM: "Premium",
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const type: string = body?.type ?? ""
  const obj = body?.data?.object ?? {}

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
    // Marcar como vencida y notificar al admin
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
