import type { TenantTx } from "@/lib/tenant"

/**
 * Filtro por empresa para las búsquedas del vigilante.
 *
 * Caso de uso: un edificio con varias empresas (coworking). Cada vigilante
 * puede estar asignado a una empresa; si lo está, solo debe ver las visitas de
 * esa empresa, no las del resto del edificio (Ley N° 29733: nombres, DNI, placas).
 *
 * Reglas:
 *   - Vigilante SIN empresa  → ve TODAS las visitas de la organización
 *     (es el vigilante general del edificio; comportamiento por defecto).
 *   - Vigilante CON empresa  → ve SOLO las visitas de su empresa.
 *
 * Devuelve un fragmento de `where` para componer con el resto de la consulta.
 */
export async function filtroEmpresaVigilante(
  tx: TenantTx,
  userId: string,
): Promise<{ empresaId?: string }> {
  const usuario = await tx.user.findFirst({
    where: { id: userId },
    select: { empresaId: true },
  })
  return usuario?.empresaId ? { empresaId: usuario.empresaId } : {}
}
