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
  residentes: 2,
  visitasPorMes: 10,
} as const

/**
 * Paquete de visitas extra para el plan GRATIS: pago único, se usa solo cuando
 * ya se agotaron las visitas incluidas del mes y VENCE al terminar el mes
 * calendario (hora de Lima) en que se compró; lo no usado se pierde.
 *
 * El precio está pensado para ser un parche puntual: unos 4 paquetes al mes
 * rondan el precio de Pro, así que el uso intenso conviene resolverlo con Pro.
 * Si cambia el precio, actualizar también la portada, el brochure y los términos.
 */
export const PAQUETE_VISITAS = {
  visitas: 20,
  /** En céntimos, como lo pide Culqi. */
  amount: 1900,
  precioStr: "S/ 19.00",
} as const

/**
 * Días de gracia tras un cobro fallido de Pro: la cuenta sigue en Pro y el
 * admin puede volver a pagar. Pasado el plazo, pasa a Gratis (lib/degradar-plan.ts).
 */
export const DIAS_GRACIA_COBRO = 5

/**
 * Días que se conservan las empresas configuradas de una cuenta que pasó de
 * Pro a Gratis. Si vuelve a Pro antes, se recuperan; después se borran.
 */
export const DIAS_CONSERVAR_EMPRESAS = 30

const DIA_MS = 24 * 3_600_000

/** Instante en que vence el periodo de gracia de un cobro fallido. */
export function finGraciaCobro(cobroFallidoEn: Date): Date {
  return new Date(cobroFallidoEn.getTime() + DIAS_GRACIA_COBRO * DIA_MS)
}

/** Fecha antes de la cual un paso a Gratis ya no conserva sus empresas. */
export function corteConservarEmpresas(ahora: Date = new Date()): Date {
  return new Date(ahora.getTime() - DIAS_CONSERVAR_EMPRESAS * DIA_MS)
}

/** Fecha en texto para correos y avisos: "20 de setiembre". */
export function fechaLimaTexto(fecha: Date): string {
  return fecha.toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "long" })
}

/** Días de historial que conserva el plan GRATIS; lo anterior se borra. */
export const DIAS_HISTORIAL_GRATIS = 30

/** Fecha a partir de la cual se conserva el historial del plan Gratis. */
export function fechaCorteHistorial(ahora: Date = new Date()): Date {
  return new Date(ahora.getTime() - DIAS_HISTORIAL_GRATIS * 24 * 3_600_000)
}

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

/**
 * Saldo de visitas extra que todavía se puede usar: el que se compró en el mes
 * en curso. Un saldo de un mes anterior ya venció y cuenta como cero.
 */
export function saldoExtraVigente(
  condominio: { visitasExtra: number; visitasExtraInicio: Date | null },
  ahora: Date = new Date(),
): number {
  const { visitasExtraInicio } = condominio
  if (!visitasExtraInicio || visitasExtraInicio.getTime() !== inicioMesLima(ahora).getTime()) return 0
  return condominio.visitasExtra
}

/** Último día del mes en curso en Lima, en texto: "30 de septiembre". */
export function finDeMesLimaTexto(ahora: Date = new Date()): string {
  const inicio = inicioMesLima(ahora)
  const inicioSiguiente = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 1, OFFSET_LIMA_HORAS))
  return new Date(inicioSiguiente.getTime() - 1).toLocaleDateString("es-PE", {
    timeZone: "America/Lima", day: "numeric", month: "long",
  })
}

/** Días que quedan del mes en curso en Lima, contando el de hoy. */
export function diasRestantesMesLima(ahora: Date = new Date()): number {
  const inicio = inicioMesLima(ahora)
  const inicioSiguiente = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 1, OFFSET_LIMA_HORAS)
  return Math.ceil((inicioSiguiente - ahora.getTime()) / 86_400_000)
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
