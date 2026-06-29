import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// Llamar con: GET /api/cron/keepalive-redis
// Header: Authorization: Bearer <CRON_SECRET>
// Vercel Cron: { "crons": [{ "path": "/api/cron/keepalive-redis", "schedule": "0 6 * * *" }] }
//
// Propósito: generar tráfico mínimo en la base Upstash (Free Tier) para que
// no sea archivada por inactividad. Hace un par de operaciones triviales.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return NextResponse.json(
      { ok: false, error: "Upstash no configurado (faltan UPSTASH_REDIS_REST_*)" },
      { status: 503 }
    )
  }

  try {
    const redis = new Redis({ url, token })
    const now = new Date().toISOString()
    await redis.set("keepalive:last-ping", now)
    const pings = await redis.incr("keepalive:counter")

    console.log(`[cron] keepalive-redis: ping #${pings} @ ${now}`)

    return NextResponse.json({ ok: true, pings, timestamp: now })
  } catch (err) {
    console.error("[cron] keepalive-redis: Upstash falló:", err)
    return NextResponse.json(
      { ok: false, error: "Fallo al contactar Upstash" },
      { status: 502 }
    )
  }
}
