import { AuditoriaCliente } from "./auditoria-cliente"

export const metadata = { title: "Auditoría — Gatekeeper Admin" }

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro completo de actividad del sistema.
        </p>
      </div>
      <AuditoriaCliente />
    </div>
  )
}
