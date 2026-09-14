"use client"

import { CLAVES_PERIODO, PERIODOS_PRO, precioMensualEquivalente, textoRenovacion, type PeriodoPro } from "@/lib/periodos-pro"

/** Elección del periodo de facturación del plan Pro (mensual, 3, 6 o 12 meses). */
export function SelectorPeriodo({
  valor,
  onChange,
  deshabilitado,
}: {
  valor: PeriodoPro
  onChange: (p: PeriodoPro) => void
  deshabilitado?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Periodo de pago" className="grid grid-cols-2 gap-2">
      {CLAVES_PERIODO.map((clave) => {
        const p = PERIODOS_PRO[clave]
        const activo = clave === valor
        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={deshabilitado}
            onClick={() => onChange(clave)}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
              activo ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
            }`}
          >
            <span className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold">{p.etiqueta}</span>
              {p.descuento && (
                <span className="text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5 whitespace-nowrap">
                  {p.descuento}
                </span>
              )}
            </span>
            <span className="block text-base font-bold mt-0.5">{p.precioStr}</span>
            <span className="block text-xs text-muted-foreground">
              {textoRenovacion(clave)}
              {p.meses > 1 && ` · ${precioMensualEquivalente(clave)}/mes`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
