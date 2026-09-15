// Lógica pura de estado de suscripción.
// Se usa tanto en el callback JWT (lib/auth.ts) como en el middleware,
// y se testea en lib/subscription.test.ts.
//
// Hay dos planes y NO hay período de prueba:
//   - GRATIS: no caduca nunca. Su acceso jamás se bloquea.
//   - PRO:    depende del estado del cobro (Culqi o transferencia).

/**
 * Estados que cortan el acceso del admin al panel (salvo /admin/suscripcion).
 *
 * "fallida" YA NO bloquea: abre un periodo de gracia en el que la cuenta sigue
 * en Pro; si no paga, pasa a Gratis (nunca se bloquea). "vencida" solo queda
 * por datos antiguos: el cron las pasa a Gratis.
 */
export const ESTADOS_BLOQUEADOS = ["vencida"] as const

/**
 * Resuelve el estado efectivo de la suscripción de una organización.
 *
 * El plan GRATIS está siempre activo: no hay fecha de caducidad que revisar.
 * Para PRO se devuelve el estado guardado tal cual ("activa" si es nulo).
 *
 * @param suscripcionEstado estado guardado en BD ("activa", "cancelada", "vencida", "fallida")
 * @param plan plan de la organización ("GRATIS" | "PRO")
 */
export function resolverEstadoSuscripcion(
  suscripcionEstado: string | null | undefined,
  plan?: string | null,
): string {
  if (plan === "GRATIS") return "activa"
  return suscripcionEstado ?? "activa"
}

/** True si el estado bloquea el acceso del admin al panel. */
export function estaBloqueada(estado: string | null | undefined): boolean {
  return !!estado && (ESTADOS_BLOQUEADOS as readonly string[]).includes(estado)
}
