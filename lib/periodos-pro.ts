/**
 * Periodos de facturación del plan PRO. Cada uno es una suscripción recurrente
 * distinta en Culqi: al terminar el periodo se vuelve a cobrar el MISMO monto
 * con descuento. Si se cancela a mitad de periodo, el acceso sigue hasta el
 * final de lo pagado y no se devuelven los meses restantes.
 *
 * `codigoCulqi` es el "short_name" del plan creado en el panel de Culqi. El
 * monto de ese plan debe coincidir con `amount`: `resolverPlanCulqi` lo
 * comprueba antes de suscribir, para no cobrar nunca un precio distinto al
 * que se muestra.
 *
 * Si cambian los precios, actualizar también la portada, el brochure y los
 * términos.
 */
export const PERIODOS_PRO = {
  mensual: {
    etiqueta: "Mensual",
    meses: 1,
    amount: 8900,
    precioStr: "S/ 89",
    descuento: null,
    codigoCulqi: "plan-pro-2026",
  },
  trimestral: {
    etiqueta: "Trimestral",
    meses: 3,
    amount: 25400,
    precioStr: "S/ 254",
    descuento: "5% de descuento",
    codigoCulqi: "plan-pro-trimestral-2026",
  },
  semestral: {
    etiqueta: "Semestral",
    meses: 6,
    amount: 48000,
    precioStr: "S/ 480",
    descuento: "10% de descuento",
    codigoCulqi: "plan-pro-semestral-2026",
  },
  anual: {
    etiqueta: "Anual",
    meses: 12,
    amount: 89000,
    precioStr: "S/ 890",
    descuento: "2 meses gratis",
    codigoCulqi: "plan-pro-anual-2026",
  },
} as const

export type PeriodoPro = keyof typeof PERIODOS_PRO

export const CLAVES_PERIODO = Object.keys(PERIODOS_PRO) as [PeriodoPro, ...PeriodoPro[]]

/** "cada mes", "cada 3 meses", "cada año". */
export function textoRenovacion(periodo: PeriodoPro): string {
  const { meses } = PERIODOS_PRO[periodo]
  if (meses === 1) return "cada mes"
  if (meses === 12) return "cada año"
  return `cada ${meses} meses`
}

/** Precio mensual equivalente, redondeado a céntimos, para comparar periodos. */
export function precioMensualEquivalente(periodo: PeriodoPro): string {
  const { amount, meses } = PERIODOS_PRO[periodo]
  return `S/ ${(amount / 100 / meses).toFixed(2)}`
}

/**
 * Periodo de una suscripción según el monto de su plan. La suscripción de
 * Culqi devuelve el monto pero no el short_name, y cada periodo tiene un monto
 * distinto.
 */
export function periodoPorMonto(amount: number | null | undefined): PeriodoPro | null {
  if (amount == null) return null
  return CLAVES_PERIODO.find((p) => PERIODOS_PRO[p].amount === amount) ?? null
}
