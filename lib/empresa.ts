import type { TenantTx } from "@/lib/tenant"

/**
 * Filtro por empresa para lo que ve el vigilante (búsquedas por placa, DNI y
 * QR, pantalla «Dentro» y registro de ingreso/salida).
 *
 * Caso de uso: un edificio con varias empresas (coworking, oficinas). A un
 * vigilante se le pueden asignar una o varias empresas; si tiene alguna, solo
 * debe ver las visitas de esas empresas, no las del resto del edificio
 * (Ley N° 29733: nombres, DNI, placas).
 *
 * Reglas:
 *   - Empresas es una función del plan PRO. En una organización GRATIS el
 *     filtro no se aplica aunque queden asignaciones guardadas (por ejemplo,
 *     de una cuenta que dejó de pagar): el vigilante ve todo, como en un
 *     condominio normal. Si vuelve a Pro, las asignaciones recuperan efecto.
 *   - Vigilante SIN empresas asignadas → ve TODAS las visitas de la
 *     organización. Es el comportamiento por defecto.
 *   - Vigilante CON empresas asignadas → ve SOLO las visitas de esas empresas.
 *     Las visitas sin empresa (departamentos del mismo edificio) quedan fuera:
 *     si se le asignaron empresas explícitamente, es para acotarlo a ellas.
 *
 * Devuelve un fragmento de `where` sobre Visita para componer con la consulta.
 */
export async function filtroEmpresaVigilante(
  tx: TenantTx,
  userId: string,
): Promise<{ empresaId?: { in: string[] } }> {
  const usuario = await tx.user.findFirst({
    where: { id: userId },
    select: { rol: true, condominio: { select: { plan: true } } },
  })
  if (usuario?.rol !== "VIGILANTE" || usuario.condominio?.plan !== "PRO") return {}

  const asignadas = await tx.vigilanteEmpresa.findMany({
    where: { vigilanteId: userId },
    select: { empresaId: true },
  })
  if (asignadas.length === 0) return {}
  return { empresaId: { in: asignadas.map((a) => a.empresaId) } }
}

/** Mensaje de las acciones de Empresas en el plan Gratis. */
export const MENSAJE_EMPRESAS_SOLO_PRO =
  "Empresas (coworking y oficinas) es parte del plan Pro. Puedes contratarlo desde Suscripción."
