"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

/**
 * Espacio publicitario del plan GRATIS.
 *
 * Solo se renderiza en cuentas gratuitas: los clientes Pro no ven anuncios y
 * eso es parte de lo que pagan. Quien decide es el server component que lo
 * monta (ver lib/plan.ts → esPlanGratis).
 *
 * Sin `NEXT_PUBLIC_ADSENSE_CLIENT` configurado muestra un aviso propio que
 * invita a pasar a Pro, así el hueco nunca se ve roto ni vacío mientras la
 * cuenta de AdSense está en revisión.
 */

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface Props {
  /** Slot de AdSense para esta ubicación. */
  slot?: string
  /**
   * Muestra el enlace a la suscripción. Solo para el panel de administración:
   * residentes y vigilantes no tienen acceso a esa ruta ni deciden el plan.
   */
  conEnlacePro?: boolean
  className?: string
}

export function EspacioPublicitario({ slot, conEnlacePro = false, className = "" }: Props) {
  const iniciado = useRef(false)

  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot || iniciado.current) return
    iniciado.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      // Un bloqueador de anuncios hace fallar el push. No es un error de la app.
    }
  }, [slot])

  // Sin AdSense configurado: promoción propia, sin scripts de terceros.
  if (!ADSENSE_CLIENT || !slot) {
    return (
      <div className={`rounded-xl border border-dashed bg-muted/40 px-4 py-3 print:hidden ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
            Estás usando Gatekeeper gratis.
          </p>
          {conEnlacePro && (
            <Link
              href="/admin/suscripcion"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-4 whitespace-nowrap"
            >
              Conoce el plan Pro →
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`print:hidden ${className}`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
        Publicidad
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  )
}
