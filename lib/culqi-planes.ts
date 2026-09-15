import { PERIODOS_PRO, type PeriodoPro } from "@/lib/periodos-pro"

const CULQI_BASE = "https://api.culqi.com/v2"

type PlanCulqi = { id: string; short_name?: string; amount?: number; status?: number }

/**
 * Busca en Culqi el plan del periodo elegido y devuelve su id.
 *
 * Falla (en vez de suscribir) si el plan no existe o si su monto no coincide
 * con el que mostramos: un plan mal configurado en el panel no debe cobrarle a
 * nadie un precio distinto.
 */
export async function resolverPlanCulqi(periodo: PeriodoPro, secretKey: string): Promise<string> {
  const esperado = PERIODOS_PRO[periodo]
  const res = await fetch(`${CULQI_BASE}/recurrent/plans?limit=50`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json().catch(() => ({})) as { data?: PlanCulqi[] }
  // status 1 = activo; los planes desactivados en el panel vuelven con status 2.
  const plan = (data.data ?? []).find((p) => p.short_name === esperado.codigoCulqi && p.status === 1)

  if (!plan) {
    console.error(`[Culqi] no existe el plan '${esperado.codigoCulqi}'`)
    throw new Error("Este periodo de pago no está disponible en este momento. Escríbenos a soporte@gatekeeper-app.org.")
  }
  if (plan.amount !== esperado.amount) {
    console.error(`[Culqi] el plan '${esperado.codigoCulqi}' cobra ${plan.amount} y se esperaba ${esperado.amount}`)
    throw new Error("Este periodo de pago no está disponible en este momento. Escríbenos a soporte@gatekeeper-app.org.")
  }
  return plan.id
}
