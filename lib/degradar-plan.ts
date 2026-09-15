import { runAsAdmin, type AdminTx } from "@/lib/tenant"
import { LIMITES_GRATIS } from "@/lib/limites-plan"
import { enviarEmailPasoAGratis } from "@/lib/email"

/**
 * Paso de una organización PRO al plan GRATIS cuando deja de pagar.
 *
 * Regla del negocio (definida por el usuario, set 2026):
 *   - La organización NO se bloquea: vuelve a Gratis.
 *   - El administrador se mantiene (siempre hay uno solo).
 *   - Se conservan los vigilantes y residentes MÁS ANTIGUOS hasta el límite del
 *     plan Gratis; los más recientes se ELIMINAN, con sus visitas, plantillas y
 *     turnos (misma cascada que el borrado manual de un usuario).
 *
 * Los contadores acumulativos del plan Gratis se reinician a lo que queda: el
 * recorte fue forzado por el sistema, no una rotación del cliente.
 */

export type UsuarioOrdenable = { id: string; nombre: string; email: string; createdAt: Date }

/** Separa a los que se quedan (los más antiguos) de los que se eliminan. */
export function repartirPorAntiguedad<T extends UsuarioOrdenable>(usuarios: T[], limite: number) {
  const ordenados = [...usuarios].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  )
  return { conservados: ordenados.slice(0, limite), eliminados: ordenados.slice(limite) }
}

/** Borra un usuario y todo lo que depende de él (las relaciones son Restrict). */
async function eliminarUsuarioEnCascada(tx: AdminTx, userId: string) {
  await tx.registroIngreso.updateMany({ where: { vigilanteIngresoId: userId }, data: { vigilanteIngresoId: null } })
  await tx.registroIngreso.updateMany({ where: { vigilanteSalidaId: userId }, data: { vigilanteSalidaId: null } })
  await tx.plantillaVisita.deleteMany({ where: { residenteId: userId } })
  await tx.registroIngreso.deleteMany({ where: { visita: { residenteId: userId } } })
  await tx.visita.deleteMany({ where: { residenteId: userId } })
  await tx.turnoVigilante.deleteMany({ where: { vigilanteId: userId } })
  await tx.logActividad.deleteMany({ where: { userId } })
  // VigilanteEmpresa se borra solo (ON DELETE CASCADE).
  await tx.user.delete({ where: { id: userId } })
}

export type ResultadoRecorte = {
  residentesEliminados: UsuarioOrdenable[]
  vigilantesEliminados: UsuarioOrdenable[]
  residentesConservados: number
  vigilantesConservados: number
}

/**
 * Deja la organización dentro de los límites de usuarios del plan Gratis.
 * Debe ir dentro de `runAsAdmin`. No toca el plan ni la suscripción.
 */
export async function recortarAlPlanGratis(tx: AdminTx, condominioId: string): Promise<ResultadoRecorte> {
  const seleccion = { id: true, nombre: true, email: true, createdAt: true } as const
  const [residentes, vigilantes] = await Promise.all([
    tx.user.findMany({ where: { condominioId, rol: "RESIDENTE" }, select: seleccion }),
    tx.user.findMany({ where: { condominioId, rol: "VIGILANTE" }, select: seleccion }),
  ])

  const r = repartirPorAntiguedad(residentes, LIMITES_GRATIS.residentes)
  const v = repartirPorAntiguedad(vigilantes, LIMITES_GRATIS.vigilantes)

  for (const u of [...r.eliminados, ...v.eliminados]) {
    await eliminarUsuarioEnCascada(tx, u.id)
  }

  await tx.condominio.update({
    where: { id: condominioId },
    data: { residentesCreados: r.conservados.length, vigilantesCreados: v.conservados.length },
  })

  return {
    residentesEliminados: r.eliminados,
    vigilantesEliminados: v.eliminados,
    residentesConservados: r.conservados.length,
    vigilantesConservados: v.conservados.length,
  }
}

/**
 * Pasa la organización a Gratis: recorta usuarios, cambia el plan, da de baja
 * la suscripción en Culqi (para que un reintento de cobro no le cobre a una
 * cuenta que ya es gratis) y avisa al administrador por correo.
 *
 * Idempotente: si ya es Gratis y está dentro de los límites, no hace nada.
 */
export async function degradarAGratis(condominioId: string, motivo: string) {
  const resultado = await runAsAdmin(async (tx) => {
    const condominio = await tx.condominio.findUnique({
      where: { id: condominioId },
      select: { id: true, nombre: true, plan: true, culqiSubscriptionId: true },
    })
    if (!condominio) return null

    const recorte = await recortarAlPlanGratis(tx, condominioId)
    const huboRecorte = recorte.residentesEliminados.length + recorte.vigilantesEliminados.length > 0
    if (condominio.plan === "GRATIS" && !huboRecorte) return null

    await tx.condominio.update({
      where: { id: condominioId },
      data: { plan: "GRATIS", suscripcionEstado: "activa", activo: true, culqiSubscriptionId: null },
    })

    const admin = await tx.user.findFirst({
      where: { condominioId, rol: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, nombre: true, email: true },
    })
    if (admin) {
      await tx.logActividad.create({
        data: {
          userId: admin.id,
          accion: "PASO_A_GRATIS",
          detalle: JSON.stringify({
            motivo,
            suscripcionAnterior: condominio.culqiSubscriptionId,
            residentesEliminados: recorte.residentesEliminados.map((u) => u.email),
            vigilantesEliminados: recorte.vigilantesEliminados.map((u) => u.email),
          }),
        },
      })
    }
    return { condominio, recorte, admin }
  })

  if (!resultado) return null
  const { condominio, recorte, admin } = resultado

  const secretKey = process.env.CULQI_SECRET_KEY
  if (condominio.culqiSubscriptionId && secretKey) {
    const res = await fetch(`https://api.culqi.com/v2/recurrent/subscriptions/${condominio.culqiSubscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    }).catch(() => null)
    if (!res?.ok) {
      console.error("[paso-a-gratis] No se pudo dar de baja en Culqi; revisar a mano:", condominio.culqiSubscriptionId)
    }
  }

  if (admin) {
    void enviarEmailPasoAGratis({
      emailAdmin: admin.email,
      nombreAdmin: admin.nombre,
      condominioNombre: condominio.nombre,
      residentesEliminados: recorte.residentesEliminados.map((u) => u.nombre),
      vigilantesEliminados: recorte.vigilantesEliminados.map((u) => u.nombre),
    })
  }

  console.log(`[paso-a-gratis] ${condominio.nombre} (${motivo}): -${recorte.residentesEliminados.length} residentes, -${recorte.vigilantesEliminados.length} vigilantes`)
  return recorte
}
