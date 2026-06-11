import { runAsAdmin } from "@/lib/tenant"
import { NextResponse } from "next/server"

// Llamar con: GET /api/cron/expirar-visitas
// Header: Authorization: Bearer <CRON_SECRET>
// Vercel Cron: { "crons": [{ "path": "/api/cron/expirar-visitas", "schedule": "0 * * * *" }] }
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

  return NextResponse.json({
    ok: true,
    expiradas: count,
    timestamp: new Date().toISOString(),
  })
}
