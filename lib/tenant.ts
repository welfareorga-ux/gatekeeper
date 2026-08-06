import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

/**
 * Aislamiento multi-tenant por `condominioId`.
 *
 * GateKeeper es SaaS multi-tenant: todos los condominios comparten la misma DB,
 * separados por el campo `condominioId`. Olvidar el filtro en una sola query =
 * fuga cross-tenant (Ley N° 29733 — datos personales: nombres, DNI, placas).
 *
 * Este módulo centraliza el aislamiento en dos capas:
 *   1. `requireCondominioId` / `tenantWhere`: guardas reutilizables para las rutas.
 *   2. `forTenant(condominioId)`: cliente Prisma que inyecta el `condominioId`
 *      automáticamente, para que ninguna ruta futura pueda olvidarlo.
 */

/** Se lanza cuando una sesión no tiene condominio asociado (SuperAdmin o cuenta huérfana). */
export class SinCondominioError extends Error {
  constructor() {
    super("Sin condominio asociado")
    this.name = "SinCondominioError"
  }
}

/**
 * Devuelve el `condominioId` de la sesión o lanza `SinCondominioError`.
 * Úsalo en TODA ruta tenant-scoped tras validar la sesión.
 */
export function requireCondominioId(session: Session | null): string {
  const id = session?.user?.condominioId
  if (!id) throw new SinCondominioError()
  return id
}

/** Cláusula `where` con el tenant; sólo para modelos con `condominioId` directo. */
export function tenantWhere(session: Session | null): { condominioId: string } {
  return { condominioId: requireCondominioId(session) }
}

/**
 * Modelos con columna `condominioId` propia → `forTenant` puede aislarlos solo.
 *
 * ⚠️ Modelos SIN columna propia (`Vehiculo`, `RegistroIngreso`, `LogActividad`)
 * NO los cubre la extensión: filtra a mano por relación
 * (p.ej. `where: { visita: { condominioId } }`, `where: { user: { condominioId } }`).
 */
export const MODELOS_TENANT = new Set([
  "User",
  "Visita",
  "TurnoVigilante",
  "PlantillaVisita",
  "Empresa",
])

/** Operaciones cuyo aislamiento va en `args.where`. */
const OPS_FILTRO = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
])

/**
 * Lógica pura de inyección (testeable sin Prisma).
 *
 * - reads / `updateMany` / `deleteMany` → fija `where.condominioId`.
 * - `create` / `createMany` → fija `data.condominioId`.
 * - `findUnique` / `update` / `delete` / `upsert` por id único: NO se tocan
 *   (Prisma rechaza `condominioId` en un `where` único). Para acceso por id en
 *   un tenant, usa `findFirst` con `tenantWhere` y verifica propiedad antes de mutar.
 */
export function inyectarTenant(
  model: string | undefined,
  operation: string,
  args: unknown,
  condominioId: string,
): unknown {
  if (!model || !MODELOS_TENANT.has(model)) return args
  const a = (args ?? {}) as Record<string, unknown>

  if (OPS_FILTRO.has(operation)) {
    return { ...a, where: { ...(a.where as object), condominioId } }
  }
  if (operation === "create") {
    return { ...a, data: { ...(a.data as object), condominioId } }
  }
  if (operation === "createMany") {
    if (Array.isArray(a.data)) {
      return { ...a, data: a.data.map((d) => ({ ...(d as object), condominioId })) }
    }
    if (a.data) {
      return { ...a, data: { ...(a.data as object), condominioId } }
    }
  }
  return args
}

/**
 * Cliente Prisma acotado a un condominio. Inyecta `condominioId` automáticamente
 * en los modelos de `MODELOS_TENANT`. Crea uno por request:
 *
 *   const db = forTenant(requireCondominioId(session))
 *   await db.visita.findMany()          // ← where.condominioId implícito
 *   await db.visita.create({ data })    // ← data.condominioId implícito
 *
 * Propaga al `tx` dentro de `db.$transaction(async (tx) => ...)`.
 */
export function forTenant(condominioId: string) {
  return prisma.$extends({
    name: "tenant-isolation",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return query(inyectarTenant(model, operation, args, condominioId) as typeof args)
        },
      },
    },
  })
}

/**
 * Opciones para TODA transacción. `maxWait` sube de 2s (default) a 10s: da
 * margen para conseguir la conexión del pool (`max: 1`) cuando Neon despierta
 * de autosuspend en horas sin tráfico (p.ej. el cron de medianoche), que era la
 * causa del error "Unable to start a transaction in the given time".
 */
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const

export type TenantPrisma = ReturnType<typeof forTenant>

/** Cliente transaccional acotado al tenant (con inyección de condominioId). */
export type TenantTx = Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0]
/** Cliente transaccional sin acotar (acceso cross-tenant). */
export type AdminTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * Ejecuta `fn` dentro de UNA transacción con `app.condominio_id` fijado
 * (SET LOCAL, scope de transacción → seguro con el pool de Neon). Combina:
 *   - Capa 2: inyección automática de condominioId en los args (forTenant).
 *   - Capa 3: Row-Level Security en Postgres usa app.condominio_id para filtrar.
 *
 * Úsalo en TODA ruta tenant-scoped. Mantén el cómputo pesado / llamadas a APIs
 * externas (email, Culqi) FUERA del callback para no alargar la transacción:
 *
 *   const visitas = await withTenant(condominioId, (tx) => tx.visita.findMany())
 *   void enviarEmail(...)  // ← fuera
 */
export async function withTenant<T>(
  condominioId: string,
  fn: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  return forTenant(condominioId).$transaction(async (tx) => {
    // set_config(..., true) = SET LOCAL: vive solo en esta transacción.
    await tx.$executeRaw`SELECT set_config('app.condominio_id', ${condominioId}, true)`
    return fn(tx as TenantTx)
  }, TX_OPTIONS)
}

/**
 * Ejecuta `fn` con RLS en modo bypass (acceso a TODOS los condominios).
 * SOLO para operaciones legítimamente cross-tenant o sin contexto de tenant:
 * login (buscar usuario por email), registro (crear condominio), cron,
 * webhooks, panel SuperAdmin y el seed. NUNCA en rutas de un condominio.
 */
export async function runAsAdmin<T>(fn: (tx: AdminTx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`
    return fn(tx as AdminTx)
  }, TX_OPTIONS)
}
