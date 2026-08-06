import { EmpresasCliente } from "./empresas-cliente"

export const metadata = { title: "Empresas — Gatekeeper Admin" }

export default function EmpresasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Empresas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Si en tu edificio conviven varias empresas (coworking, oficinas), regístralas aquí
          y asígnalas a cada residente. Es opcional: los residentes que no pertenecen a
          ninguna empresa se quedan sin asignar.
        </p>
      </div>
      <EmpresasCliente />
    </div>
  )
}
