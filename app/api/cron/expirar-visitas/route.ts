import { runAsAdmin } from "@/lib/tenant"
import { purgarHistorialGratis } from "@/lib/retencion"
import { degradarAGratis } from "@/lib/degradar-plan"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Llamar con: GET /api/cron/expirar-visitas
// Header: Authorization: Bearer <CRON_SECRET>
// Vercel Cron diario (vercel.json, 05:00 UTC = medianoche en Lima).
//
// Hace las tareas de mantenimiento en la misma pasada, para no depender de
// más crons en el plan de Vercel:
//   1. Marca como EXPIRADO las visitas pendientes vencidas.
//   2. Pasa a Gratis las organizaciones Pro que dejaron de pagar.
//   3. Borra el historial de más de 30 días del plan Gratis (lib/retencion.ts).
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Marca como EXPIRADO las visitas PENDIENTE cuya horaFin pasó hace más de 4 horas
  const limite = new Date()
  limite.setHours(limite.getHours() - 4)

  // El cron corre sobre TODOS los condominios → bypass RLS.
  const { count } = await runAsAdmin((tx) => tx.visita.updateMany({
    where: {
      estado: "PENDIENTE",
      horaFin: { lt: limite },
    },
    data: { estado: "EXPIRADO" },
  }))

  console.log(`[cron] expirar-visitas: ${count} visitas marcadas como EXPIRADO`)

  const pasadasAGratis = await pasarAGratisLasQueDejaronDePagar()

  // Transacción aparte: si el borrado fallara, lo de arriba ya quedó hecho.
  // Va después del paso a Gratis para que esas cuentas ya se recorten hoy.
  const purgado = await runAsAdmin((tx) => purgarHistorialGratis(tx))
  console.log("[cron] historial plan Gratis purgado:", JSON.stringify(purgado))

  return NextResponse.json({
    ok: true,
    expiradas: count,
    pasadasAGratis,
    purgado,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Red de seguridad por si Culqi no avisa por webhook:
 *   - "vencida" o "fallida" → pasa a Gratis.
 *   - "cancelada" → pasa a Gratis cuando termina el periodo pagado, según la
 *     fecha de próximo cobro que devuelve Culqi. Hasta entonces sigue en Pro.
 */
async function pasarAGratisLasQueDejaronDePagar(): Promise<number> {
  const candidatas = await prisma.condominio.findMany({
    where: { plan: "PRO", suscripcionEstado: { in: ["cancelada", "vencida", "fallida"] } },
    select: { id: true, suscripcionEstado: true, culqiSubscriptionId: true },
  })

  let pasadas = 0
  for (const c of candidatas) {
    try {
      if (c.suscripcionEstado !== "cancelada") {
        if (await degradarAGratis(c.id, `cron ${c.suscripcionEstado}`)) pasadas++
        continue
      }

      const secretKey = process.env.CULQI_SECRET_KEY
      if (!c.culqiSubscriptionId || !secretKey) continue
      const res = await fetch(`https://api.culqi.com/v2/recurrent/subscriptions/${c.culqiSubscriptionId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      if (!res.ok) continue
      const sub = await res.json().catch(() => ({})) as { next_billing_date?: number }
      // Culqi devuelve segundos; por si acaso se aceptan milisegundos.
      const fin = sub.next_billing_date
        ? (sub.next_billing_date > 1e12 ? sub.next_billing_date : sub.next_billing_date * 1000)
        : null
      if (fin && fin < Date.now()) {
        if (await degradarAGratis(c.id, "cron cancelada: terminó el periodo pagado")) pasadas++
      }
    } catch (e) {
      console.error("[cron] no se pudo pasar a Gratis la organización", c.id, e)
    }
  }
  return pasadas
}
