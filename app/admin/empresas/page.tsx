import Link from "next/link"
import { getServerSession } from "next-auth"
import { Building2, Lock, ShieldCheck } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { esPlanGratis } from "@/lib/plan"
import { Button } from "@/components/ui/button"
import { EmpresasCliente } from "./empresas-cliente"

export const metadata = { title: "Empresas — Gatekeeper Admin" }

export default async function EmpresasPage() {
  const session = await getServerSession(authOptions)
  // Empresas es del plan Pro. Las rutas /api/admin/empresas también lo exigen.
  const bloqueado = await esPlanGratis(session?.user.condominioId)

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
      {bloqueado ? (
        <div className="rounded-xl border p-8 text-center space-y-4 max-w-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Empresas es parte del plan Pro</p>
            <p className="text-sm text-muted-foreground">
              Para edificios de oficinas y coworking: cada empresa puede tener su propio vigilante,
              que solo ve a los visitantes de esa empresa, mientras el vigilante del edificio ve a todos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Varias empresas por edificio</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Datos separados por empresa</span>
          </div>
          <Link href="/admin/suscripcion" className="inline-block">
            <Button>Ver plan Pro</Button>
          </Link>
        </div>
      ) : (
        <EmpresasCliente />
      )}
    </div>
  )
}
