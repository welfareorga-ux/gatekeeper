import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { UsuariosCliente } from "./usuarios-cliente"
import { limiteUsuarios } from "@/lib/limites-plan"

export const metadata = { title: "Usuarios — Gatekeeper Admin" }

/*
 * En Gratis se muestran los cupos ACUMULATIVOS (altas hechas, aunque la persona
 * ya no esté), que es lo que decide si se puede crear otra. En Pro se muestran
 * los activos y sin límite, que es lo que se vende.
 *
 * El guardarraíl de capacidad de Pro (ver TOPE_RESIDENTES_PRO en
 * app/api/admin/usuarios/route.ts) vive solo en el backend a propósito: es una
 * salvaguarda operativa nuestra, no parte de la oferta, y se amplía por cuenta
 * cuando alguien la alcanza. No debe aparecer aquí.
 */

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  const condominioId = session?.user.condominioId
  if (!condominioId) redirect("/no-autorizado")

  const [usuarios, condominio] = await withTenant(condominioId, (tx) => Promise.all([
    tx.user.findMany({
      select: {
        id: true, nombre: true, email: true, telefono: true, rol: true,
        direccion: true, activo: true, createdAt: true,
        empresaId: true, empresa: { select: { nombre: true } },
        empresasVigiladas: { select: { empresaId: true } },
      },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    }),
    tx.condominio.findUnique({
      where: { id: condominioId },
      select: { plan: true, residentesCreados: true, vigilantesCreados: true },
    }),
  ]))

  const plan = condominio?.plan ?? "GRATIS"
  const enGratis = plan === "GRATIS"
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
          residentes: {
            actual: enGratis ? condominio?.residentesCreados ?? 0 : activosResidentes,
            max: limiteUsuarios(plan, "RESIDENTE"),
          },
          vigilantes: {
            actual: enGratis ? condominio?.vigilantesCreados ?? 0 : activosVigilantes,
            max: limiteUsuarios(plan, "VIGILANTE"),
          },
        }}
      />
    </div>
  )
}
