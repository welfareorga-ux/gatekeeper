import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { UsuariosCliente } from "./usuarios-cliente"

export const metadata = { title: "Usuarios — Gatekeeper Admin" }

const LIMITES_PLAN: Record<string, { residentes: number; vigilantes: number }> = {
  BASICO:   { residentes: 20,       vigilantes: 1        },
  ESTANDAR: { residentes: 50,       vigilantes: 3        },
  PREMIUM:  { residentes: Infinity, vigilantes: Infinity },
}

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  const condominioId = session?.user.condominioId
  if (!condominioId) redirect("/no-autorizado")

  const [usuarios, condominio] = await withTenant(condominioId, (tx) => Promise.all([
    tx.user.findMany({
      select: { id: true, nombre: true, email: true, telefono: true, rol: true, direccion: true, activo: true, createdAt: true },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    }),
    tx.condominio.findUnique({
      where: { id: condominioId },
      select: { plan: true },
    }),
  ]))

  const plan = condominio?.plan ?? "BASICO"
  const limites = LIMITES_PLAN[plan]
  const activosResidentes = usuarios.filter((u) => u.rol === "RESIDENTE" && u.activo).length
  const activosVigilantes = usuarios.filter((u) => u.rol === "VIGILANTE" && u.activo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona residentes, vigilantes y administradores.
        </p>
      </div>
      <UsuariosCliente
        usuariosIniciales={usuarios.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        limites={{
          plan,
          residentes: { actual: activosResidentes, max: limites.residentes },
          vigilantes: { actual: activosVigilantes, max: limites.vigilantes },
        }}
      />
    </div>
  )
}
