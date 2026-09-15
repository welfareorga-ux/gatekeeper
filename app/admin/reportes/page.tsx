import Link from "next/link"
import { getServerSession } from "next-auth"
import { BarChart3, FileSpreadsheet, Lock } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { esPlanGratis } from "@/lib/plan"
import { Button } from "@/components/ui/button"
import { ReportesCliente } from "./reportes-cliente"

export const metadata = { title: "Reportes — Gatekeeper Admin" }

export default async function ReportesPage() {
  const session = await getServerSession(authOptions)
  // Los reportes y la exportación son del plan Pro. Las rutas /api/reportes/*
  // también lo exigen; aquí solo se evita mostrar gráficos que fallarían.
  const bloqueado = await esPlanGratis(session?.user.condominioId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estadísticas y análisis de visitas, vehículos y permanencia.
        </p>
      </div>
      {bloqueado ? (
        <div className="rounded-xl border p-8 text-center space-y-4 max-w-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Los reportes son parte del plan Pro</p>
            <p className="text-sm text-muted-foreground">
              Con Pro ves las visitas por día y por residente, los vehículos más frecuentes y el tiempo
              de permanencia, y los exportas a Excel o PDF para la junta de propietarios.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />4 reportes</span>
            <span className="flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Excel y PDF</span>
          </div>
          <Link href="/admin/suscripcion" className="inline-block">
            <Button>Ver plan Pro</Button>
          </Link>
        </div>
      ) : (
        <ReportesCliente />
      )}
    </div>
  )
}
