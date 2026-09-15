import type { TenantTx } from "@/lib/tenant"
import { LIMITES_GRATIS, inicioMesLima, limiteUsuarios } from "@/lib/limites-plan"

/**
 * Reserva de cupos del plan contra los contadores acumulativos de `Condominio`.
 *
 * Cada reserva es UN `updateMany` con la condición del límite en el `WHERE`:
 * Postgres bloquea la fila y reevalúa la condición, así que dos altas
 * simultáneas no pueden pasar ambas el último cupo. Se llaman dentro de la misma
 * transacción que crea el usuario o la visita: si esa creación falla, el cupo
 * vuelve con el rollback.
 *
 * En Pro los contadores también suben (sin condición), para que una cuenta que
 * vuelva a Gratis no arranque de cero.
 */

/** Devuelve `false` si el plan ya no admite otro usuario de ese rol. */
export async function reservarCupoUsuario(
  tx: TenantTx,
  condominioId: string,
  plan: string,
  rol: "RESIDENTE" | "VIGILANTE",
): Promise<boolean> {
  const limite = limiteUsuarios(plan, rol)
  const conLimite = limite !== Infinity

  const { count } = rol === "RESIDENTE"
    ? await tx.condominio.updateMany({
        where: { id: condominioId, ...(conLimite ? { residentesCreados: { lt: limite } } : {}) },
        data: { residentesCreados: { increment: 1 } },
      })
    : await tx.condominio.updateMany({
        where: { id: condominioId, ...(conLimite ? { vigilantesCreados: { lt: limite } } : {}) },
        data: { vigilantesCreados: { increment: 1 } },
      })

  return count === 1
}

/**
 * Devuelve `false` si el plan Gratis ya agotó las visitas del mes Y no le queda
 * saldo extra vigente. El saldo extra solo se toca cuando se acabaron las
 * visitas del mes, y solo el comprado en este mismo mes (lo anterior venció).
 */
export async function reservarCupoVisita(
  tx: TenantTx,
  condominioId: string,
  plan: string,
  ahora: Date = new Date(),
): Promise<boolean> {
  const inicio = inicioMesLima(ahora)

  // Primer registro del mes: reinicia el contador. Si dos peticiones llegan a
  // la vez, la segunda ya no cumple el WHERE y no vuelve a ponerlo en cero.
  await tx.condominio.updateMany({
    where: { id: condominioId, OR: [{ visitasMesInicio: null }, { visitasMesInicio: { lt: inicio } }] },
    data: { visitasMesInicio: inicio, visitasMes: 0 },
  })

  const { count } = await tx.condominio.updateMany({
    where: {
      id: condominioId,
      ...(plan === "GRATIS" ? { visitasMes: { lt: LIMITES_GRATIS.visitasPorMes } } : {}),
    },
    data: { visitasMes: { increment: 1 } },
  })
  if (count === 1) return true

  const extra = await tx.condominio.updateMany({
    where: { id: condominioId, visitasExtra: { gt: 0 }, visitasExtraInicio: inicio },
    data: { visitasExtra: { decrement: 1 } },
  })
  return extra.count === 1
}

/**
 * Abona un paquete de visitas extra. Si el saldo que había era de un mes
 * anterior (ya vencido), primero lo pone en cero y lo asigna al mes en curso.
 * Devuelve el saldo resultante.
 */
export async function abonarPaqueteVisitas(
  tx: TenantTx,
  condominioId: string,
  visitas: number,
  ahora: Date = new Date(),
): Promise<number> {
  const inicio = inicioMesLima(ahora)

  await tx.condominio.updateMany({
    where: { id: condominioId, OR: [{ visitasExtraInicio: null }, { visitasExtraInicio: { lt: inicio } }] },
    data: { visitasExtra: 0, visitasExtraInicio: inicio },
  })

  const actualizado = await tx.condominio.update({
    where: { id: condominioId },
    data: { visitasExtra: { increment: visitas } },
    select: { visitasExtra: true },
  })
  return actualizado.visitasExtra
}
