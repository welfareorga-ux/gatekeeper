import { UsuariosCliente } from "./usuarios-cliente"

export const metadata = { title: "Usuarios — Gatekeeper SuperAdmin" }

export default function UsuariosSuperAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todos los usuarios de la plataforma. Puedes eliminar cuentas con problemas,
          incluidos administradores.
        </p>
      </div>
      <UsuariosCliente />
    </div>
  )
}
