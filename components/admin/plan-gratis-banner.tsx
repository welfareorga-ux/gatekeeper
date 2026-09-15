import Link from "next/link"
import { Sparkles } from "lucide-react"
import { LIMITES_GRATIS } from "@/lib/limites-plan"

/**
 * Aviso del plan gratuito. A diferencia del antiguo banner de prueba, NO hay
 * cuenta regresiva: el plan gratis no caduca. Muestra el cupo de visitas del
 * mes, que es el límite que antes se nota, e invita a comprar visitas o a
 * pasar a Pro.
 */
export function PlanGratisBanner({ visitasUsadas, visitasExtra }: { visitasUsadas: number; visitasExtra: number }) {
  const agotado = visitasUsadas >= LIMITES_GRATIS.visitasPorMes && visitasExtra === 0

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 print:hidden">
      <div className="container max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm flex flex-wrap items-center gap-x-2">
          <Sparkles className="h-4 w-4 text-orange-400 shrink-0" />
          <span>
            Estás en el <strong>plan Gratis</strong>
            <span className="text-slate-400">
              {" "}· {LIMITES_GRATIS.residentes} residentes · {LIMITES_GRATIS.vigilantes} vigilante ·{" "}
            </span>
            <span className={agotado ? "text-orange-400 font-semibold" : "text-slate-300"}>
              {Math.min(visitasUsadas, LIMITES_GRATIS.visitasPorMes)} de {LIMITES_GRATIS.visitasPorMes} visitas este mes
            </span>
            {visitasExtra > 0 && <span className="text-slate-300"> · +{visitasExtra} extra</span>}
          </span>
        </p>
        <div className="flex items-center gap-4 text-sm font-semibold whitespace-nowrap">
          <Link
            href="/admin/suscripcion#visitas-extra"
            className={`underline underline-offset-4 ${agotado ? "text-orange-400 hover:text-orange-300" : "text-slate-200 hover:text-white"}`}
          >
            Comprar visitas
          </Link>
          <Link
            href="/admin/suscripcion"
            className="text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            Ver plan Pro →
          </Link>
        </div>
      </div>
    </div>
  )
}
