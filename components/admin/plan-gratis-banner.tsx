import Link from "next/link"
import { Sparkles } from "lucide-react"

/**
 * Aviso del plan gratuito. A diferencia del antiguo banner de prueba, NO hay
 * cuenta regresiva: el plan gratis no caduca. Solo invita a pasar a Pro.
 */
export function PlanGratisBanner() {
  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 print:hidden">
      <div className="container max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400 shrink-0" />
          <span>
            Estás en el <strong>plan Gratis</strong>
            <span className="text-slate-400"> · 15 residentes · 1 vigilante · 50 visitas al mes</span>
          </span>
        </p>
        <Link
          href="/admin/suscripcion"
          className="text-sm font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4 whitespace-nowrap"
        >
          Ver plan Pro →
        </Link>
      </div>
    </div>
  )
}
