import { ReportesCliente } from "./reportes-cliente"

export const metadata = { title: "Reportes — Gatekeeper Admin" }

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estadísticas y análisis de visitas, vehículos y permanencia.
        </p>
      </div>
      <ReportesCliente />
    </div>
  )
}
