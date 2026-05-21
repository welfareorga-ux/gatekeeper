import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    ssl: { rejectUnauthorized: false },
  })
  // Neon está en UTC-5; forzar UTC para que TIMESTAMP WITHOUT TIME ZONE
  // se almacene y lea siempre en UTC y no expire prematuramente.
  pool.on("connect", (client) => {
    client.query("SET timezone = 'UTC'").catch(() => {})
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
