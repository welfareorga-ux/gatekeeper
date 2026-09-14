import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { PlanGratisBanner } from "@/components/admin/plan-gratis-banner"
import { EspacioPublicitario } from "@/components/ads/espacio-publicitario"
import { visitasUsadasEsteMes } from "@/lib/limites-plan"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  // El plan GRATIS no caduca, así que no hay cuenta atrás: solo un aviso
  // permanente y discreto con la vía para pasar a Pro.
  let enPlanGratis = false
  let visitasUsadas = 0
  if (session.user.condominioId) {
    const condo = await prisma.condominio.findUnique({
      where: { id: session.user.condominioId },
      select: { plan: true, visitasMes: true, visitasMesInicio: true },
    })
    enPlanGratis = condo?.plan === "GRATIS"
    if (condo) visitasUsadas = visitasUsadasEsteMes(condo)
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="admin"
        userNombre={session.user.nombre}
        rolLabel="Panel Admin"
      />
      <main className="flex-1 overflow-auto bg-background pt-14 md:pt-0">
        {enPlanGratis && <PlanGratisBanner visitasUsadas={visitasUsadas} />}
        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
          {children}
          {enPlanGratis && <EspacioPublicitario slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ADMIN} conEnlacePro />}
        </div>
      </main>
    </div>
  )
}
