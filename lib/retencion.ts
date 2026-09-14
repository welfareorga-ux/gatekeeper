import type { AdminTx } from "@/lib/tenant"
import { fechaCorteHistorial } from "@/lib/limites-plan"

/**
 * Borrado del historial del plan GRATIS con más de 30 días.
 *
 * Borra de verdad (no oculta): el objetivo es que las cuentas gratuitas no
 * acumulen datos en la base. De paso minimiza datos personales de visitantes
 * (DNI, placas), en línea con la Ley N° 29733.
 *
 * Qué se borra, solo en organizaciones GRATIS:
 *   - Visitas cuya hora de fin pasó hace más de 30 días, con sus vehículos y
 *     registros de ingreso/salida. Se SALTAN las que tienen a alguien todavía
 *     dentro (ingreso sin salida), para no romper la pantalla del vigilante.
 *   - Turnos de vigilante cerrados hace más de 30 días.
 *   - Registros de auditoría de sus usuarios con más de 30 días.
 * Y en todas las organizaciones: tokens de recuperación de contraseña vencidos.
 *
 * NO toca los contadores de cupo: las visitas borradas siguen contando para el
 * mes en que se registraron. Tampoco toca plantillas ni usuarios.
 *
 * Debe ejecutarse con `runAsAdmin` (recorre todos los tenants).
 */
export async function purgarHistorialGratis(tx: AdminTx, ahora: Date = new Date()) {
  const corte = fechaCorteHistorial(ahora)

  const gratis = await tx.condominio.findMany({ where: { plan: "GRATIS" }, select: { id: true } })
  const ids = gratis.map((c) => c.id)
  if (ids.length === 0) {
    return { visitas: 0, registros: 0, turnos: 0, logs: 0, tokens: await borrarTokensVencidos(tx, ahora) }
  }

  const visitasViejas = {
    condominioId: { in: ids },
    horaFin: { lt: corte },
    registros: { none: { fechaHoraSalida: null } },
  }

  // RegistroIngreso apunta a Visita y a Vehiculo sin cascada: va primero.
  // Los vehículos se borran solos con la visita (onDelete: Cascade).
  const registros = await tx.registroIngreso.deleteMany({ where: { visita: visitasViejas } })
  const visitas = await tx.visita.deleteMany({ where: visitasViejas })

  const turnos = await tx.turnoVigilante.deleteMany({
    where: { condominioId: { in: ids }, activo: false, horaFinTurno: { lt: corte } },
  })

  const logs = await tx.logActividad.deleteMany({
    where: { timestamp: { lt: corte }, user: { condominioId: { in: ids } } },
  })

  const tokens = await borrarTokensVencidos(tx, ahora)

  return { visitas: visitas.count, registros: registros.count, turnos: turnos.count, logs: logs.count, tokens }
}

async function borrarTokensVencidos(tx: AdminTx, ahora: Date) {
  const { count } = await tx.passwordResetToken.deleteMany({ where: { expiresAt: { lt: ahora } } })
  return count
}
