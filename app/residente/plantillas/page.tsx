import { PlantillasCliente } from "./plantillas-cliente"

export const metadata = { title: "Plantillas — Gatekeeper" }

export default function PlantillasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visitas frecuentes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tus visitantes habituales guardados como plantilla. Úsalos para registrar visitas rápidamente.
        </p>
      </div>
      <PlantillasCliente />
    </div>
  )
}
