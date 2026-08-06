import { CondominiosCliente } from "./condominios-cliente"

export const metadata = { title: "Organizaciones — Gatekeeper SuperAdmin" }

export default function CondominiosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cada organización es un cliente de la plataforma: un condominio, un edificio
          o una empresa administradora. Sus datos están aislados del resto.
        </p>
      </div>
      <CondominiosCliente />
    </div>
  )
}
