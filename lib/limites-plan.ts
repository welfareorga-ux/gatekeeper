/**
 * Límites del plan GRATIS. Única fuente de verdad para el backend y los paneles.
 *
 * Los textos públicos (portada, brochure, términos, centro de ayuda, correo de
 * bienvenida) repiten estas cifras a mano: si cambian aquí, cambiarlas allá.
 *
 * El administrador es siempre uno por organización: se crea al registrarse y el
 * panel no permite dar de alta otros (ver `crearSchema` en
 * app/api/admin/usuarios/route.ts). Se deja aquí para que la oferta completa
 * se lea en un solo sitio.
 */
export const LIMITES_GRATIS = {
  administradores: 1,
  vigilantes: 1,
  residentes: 4,
  visitasPorMes: 12,
} as const

/** Perú no tiene horario de verano: Lima es UTC-5 todo el año. */
const OFFSET_LIMA_HORAS = 5

/**
 * Instante en que empezó el mes en curso en hora de Lima.
 *
 * El cupo de visitas se reinicia a medianoche del día 1 en Perú, no en UTC: sin
 * esto, entre las 19:00 y las 24:00 del último día del mes una visita contaría
 * para el mes siguiente.
 */
export function inicioMesLima(ahora: Date = new Date()): Date {
  const enLima = new Date(ahora.getTime() - OFFSET_LIMA_HORAS * 3_600_000)
  return new Date(Date.UTC(enLima.getUTCFullYear(), enLima.getUTCMonth(), 1, OFFSET_LIMA_HORAS))
}

/**
 * Visitas ya consumidas del cupo del mes en curso. Si el contador quedó de un
 * mes anterior (nadie registró visitas desde entonces), el mes va en cero.
 */
export function visitasUsadasEsteMes(
  condominio: { visitasMes: number; visitasMesInicio: Date | null },
  ahora: Date = new Date(),
): number {
  const { visitasMesInicio } = condominio
  if (!visitasMesInicio || visitasMesInicio < inicioMesLima(ahora)) return 0
  return condominio.visitasMes
}

/** Límite de usuarios por rol según el plan. `Infinity` = sin límite comercial. */
export function limiteUsuarios(plan: string, rol: "RESIDENTE" | "VIGILANTE"): number {
  if (plan !== "GRATIS") return Infinity
  return rol === "RESIDENTE" ? LIMITES_GRATIS.residentes : LIMITES_GRATIS.vigilantes
}

/** Mensaje al alcanzar el límite de usuarios del plan Gratis. */
export function mensajeLimiteUsuarios(rol: "RESIDENTE" | "VIGILANTE"): string {
  return rol === "RESIDENTE"
    ? `El plan Gratis permite máximo ${LIMITES_GRATIS.residentes} residentes. Pasa al plan Pro para agregar más.`
    : `El plan Gratis permite ${LIMITES_GRATIS.vigilantes} vigilante. Pasa al plan Pro para agregar más.`
}
