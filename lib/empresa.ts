import type { TenantTx } from "@/lib/tenant"

/**
 * Filtro por empresa para las búsquedas del vigilante.
 *
 * Caso de uso: un edificio con varias empresas (coworking, oficinas). A un
 * vigilante se le pueden asignar una o varias empresas; si tiene alguna, solo
 * debe ver las visitas de esas empresas, no las del resto del edificio
 * (Ley N° 29733: nombres, DNI, placas).
 *
 * Reglas:
 *   - Vigilante SIN empresas asignadas → ve TODAS las visitas de la
 *     organización. Es el comportamiento por defecto y el habitual cuando no
 *     hay empresas de por medio (condominio o edificio residencial).
 *   - Vigilante CON empresas asignadas → ve SOLO las visitas de esas empresas.
 *     Las visitas sin empresa (departamentos del mismo edificio) quedan fuera:
 *     si se le asignaron empresas explícitamente, es para acotarlo a ellas.
 *
 * Devuelve un fragmento de `where` para componer con el resto de la consulta.
 */
export async function filtroEmpresaVigilante(
  tx: TenantTx,
  userId: string,
): Promise<{ empresaId?: { in: string[] } }> {
  const asignadas = await tx.vigilanteEmpresa.findMany({
    where: { vigilanteId: userId },
    select: { empresaId: true },
  })
  if (asignadas.length === 0) return {}
  return { empresaId: { in: asignadas.map((a) => a.empresaId) } }
}
