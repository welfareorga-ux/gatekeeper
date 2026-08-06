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
