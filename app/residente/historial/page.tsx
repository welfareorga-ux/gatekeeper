import { HistorialCliente } from "./historial-cliente"

export const metadata = { title: "Historial de Visitas — Gatekeeper" }

export default function HistorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de visitas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todas tus visitas registradas con filtros por estado, fecha y placa.
        </p>
      </div>
      <HistorialCliente />
    </div>
  )
}
