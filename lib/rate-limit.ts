import { Redis } from "@upstash/redis"

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number }

// ─────────────────────────────────────────────────────────────
// Fallback EN MEMORIA (por instancia serverless). Se usa cuando
// Upstash no está configurado o si Redis falla, para no romper la API.
// ─────────────────────────────────────────────────────────────
const ipMap = new Map<string, { count: number; resetAt: number }>()

// Limpia entradas caducadas cada 5 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    ipMap.forEach((val, key) => {
      if (now > val.resetAt) ipMap.delete(key)
    })
  }, 5 * 60_000)
}

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = ipMap.get(key)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    ipMap.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

// ─────────────────────────────────────────────────────────────
// Upstash Redis (contador GLOBAL y persistente entre instancias).
// Se activa solo si existen UPSTASH_REDIS_REST_URL y _TOKEN.
// ─────────────────────────────────────────────────────────────
let redis: Redis | null | undefined

function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

/**
 * Limita peticiones por `key` a `limit` cada `windowMs`.
 * Usa Upstash Redis si está configurado (recomendado en producción/Vercel,
 * donde el contador en memoria es por-instancia); si no, cae al fallback.
 */
export async function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const r = getRedis()
  if (!r) return memoryLimit(key, limit, windowMs)

  try {
    const windowSec = Math.ceil(windowMs / 1000)
    const redisKey = `rl:${key}`
    const count = await r.incr(redisKey)
    // Al primer hit fijamos la expiración de la ventana.
    if (count === 1) await r.expire(redisKey, windowSec)
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + windowMs,
    }
  } catch (err) {
    console.error("[rate-limit] Upstash falló, usando fallback en memoria:", err)
    return memoryLimit(key, limit, windowMs)
  }
}

export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return "unknown"
}
