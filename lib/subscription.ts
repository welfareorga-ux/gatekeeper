// Lógica pura de estado de suscripción / trial.
// Se usa tanto en el callback JWT (lib/auth.ts) como en el middleware,
// y se testea en lib/subscription.test.ts.

/** Estados que cortan el acceso del admin al panel (salvo /admin/suscripcion). */
export const ESTADOS_BLOQUEADOS = ["vencida", "fallida", "trial_expirado"] as const

/**
 * Resuelve el estado efectivo de la suscripción de un condominio.
 * Si está en "trial" y la fecha de fin ya pasó, devuelve "trial_expirado".
 * En cualquier otro caso devuelve el estado tal cual (o "activa" si es nulo).
 *
 * @param suscripcionEstado estado guardado en BD (p.ej. "trial", "activa", "vencida")
 * @param trialEndsAt fecha de fin del trial (o null si no aplica)
 * @param now reloj inyectable para tests (por defecto, ahora)
 */
export function resolverEstadoSuscripcion(
  suscripcionEstado: string | null | undefined,
  trialEndsAt: Date | null | undefined,
  now: Date = new Date()
): string {
  const estado = suscripcionEstado ?? "activa"
  if (estado === "trial" && trialEndsAt && trialEndsAt.getTime() < now.getTime()) {
    return "trial_expirado"
  }
  return estado
}

/** True si el estado bloquea el acceso del admin al panel. */
export function estaBloqueada(estado: string | null | undefined): boolean {
  return !!estado && (ESTADOS_BLOQUEADOS as readonly string[]).includes(estado)
}
