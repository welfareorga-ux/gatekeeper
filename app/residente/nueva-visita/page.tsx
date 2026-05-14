import { NuevaVisitaForm } from "./nueva-visita-form"

export const metadata = { title: "Nueva Visita — Gatekeeper" }

export default function NuevaVisitaPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Registrar nueva visita</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pre-registra a tu visitante para agilizar el ingreso por la portería.
        </p>
      </div>
      <NuevaVisitaForm />
    </div>
  )
}
