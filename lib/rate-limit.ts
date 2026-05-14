// Rate limiter en memoria — producción debería usar Redis/Upstash
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

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
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

export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return "unknown"
}
