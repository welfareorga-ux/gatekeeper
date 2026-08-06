import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { PlanGratisBanner } from "@/components/admin/plan-gratis-banner"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  // El plan GRATIS no caduca, así que no hay cuenta atrás: solo un aviso
  // permanente y discreto con la vía para pasar a Pro.
  let enPlanGratis = false
  if (session.user.condominioId) {
    const condo = await prisma.condominio.findUnique({
      where: { id: session.user.condominioId },
      select: { plan: true },
    })
    enPlanGratis = condo?.plan === "GRATIS"
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="admin"
        userNombre={session.user.nombre}
        rolLabel="Panel Admin"
      />
      <main className="flex-1 overflow-auto bg-background pt-14 md:pt-0">
        {enPlanGratis && <PlanGratisBanner />}
        <div className="container max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
