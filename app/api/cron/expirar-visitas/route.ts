import { runAsAdmin } from "@/lib/tenant"
import { purgarHistorialGratis } from "@/lib/retencion"
import { NextResponse } from "next/server"

// Llamar con: GET /api/cron/expirar-visitas
// Header: Authorization: Bearer <CRON_SECRET>
// Vercel Cron diario (vercel.json, 05:00 UTC = medianoche en Lima).
//
// Hace dos tareas de mantenimiento en la misma pasada, para no depender de un
// cron más en el plan de Vercel:
//   1. Marca como EXPIRADO las visitas pendientes vencidas.
//   2. Borra el historial de más de 30 días del plan Gratis (lib/retencion.ts).
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

  // Transacción aparte: si el borrado fallara, lo de arriba ya quedó hecho.
  const purgado = await runAsAdmin((tx) => purgarHistorialGratis(tx))
  console.log("[cron] historial plan Gratis purgado:", JSON.stringify(purgado))

  return NextResponse.json({
    ok: true,
    expiradas: count,
    purgado,
    timestamp: new Date().toISOString(),
  })
}
