import { prisma } from "@/lib/prisma"

/**
 * ¿La organización está en plan GRATIS?
 *
 * Se usa para decidir si mostrar el espacio publicitario: los clientes de pago
 * no ven anuncios, y eso es parte de lo que compran.
 *
 * Consulta `Condominio`, que NO tiene RLS, así que puede ir por `prisma` directo
 * sin necesidad de contexto de tenant.
 */
export async function esPlanGratis(condominioId: string | null | undefined): Promise<boolean> {
  if (!condominioId) return false
  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { plan: true },
  })
  return condominio?.plan === "GRATIS"
}

/** Mensaje de las funciones reservadas al plan Pro (reportes y exportación). */
export const MENSAJE_SOLO_PRO_REPORTES =
  "Los reportes y la exportación a Excel y PDF son parte del plan Pro. Puedes contratarlo desde Suscripción."
