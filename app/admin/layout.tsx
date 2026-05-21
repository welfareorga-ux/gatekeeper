import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { TrialBanner } from "@/components/admin/trial-banner"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  let trialEndsAt: string | null = null
  if (session.user.condominioId) {
    const condo = await prisma.condominio.findUnique({
      where: { id: session.user.condominioId },
      select: { suscripcionEstado: true, trialEndsAt: true },
    })
    if (
      condo?.suscripcionEstado === "trial" &&
      condo.trialEndsAt &&
      condo.trialEndsAt > new Date()
    ) {
      trialEndsAt = condo.trialEndsAt.toISOString()
    }
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="admin"
        userNombre={session.user.nombre}
        rolLabel="Panel Admin"
      />
      <main className="flex-1 overflow-auto bg-background pt-14 md:pt-0">
        {trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} />}
        <div className="container max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
