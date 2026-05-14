import { DentroCliente } from "./dentro-cliente"

export const metadata = { title: "Vehículos Dentro — Gatekeeper" }

export default function DentroPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vehículos dentro</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Lista en tiempo real. Se actualiza cada 30 segundos.
        </p>
      </div>
      <DentroCliente />
    </div>
  )
}
