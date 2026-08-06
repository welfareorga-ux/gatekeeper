import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { EspacioPublicitario } from "@/components/ads/espacio-publicitario"
import { esPlanGratis } from "@/lib/plan"

export default async function ResidenteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol === "VIGILANTE") redirect("/vigilante")

  const conPublicidad = await esPlanGratis(session.user.condominioId)

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="residente"
        userNombre={session.user.nombre}
        userDireccion={session.user.direccion}
        rolLabel="Portal Residente"
      />
      <main className="flex-1 overflow-auto bg-background pt-14 md:pt-0">
        <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
          {children}
          {conPublicidad && <EspacioPublicitario slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESIDENTE} />}
        </div>
      </main>
    </div>
  )
}
