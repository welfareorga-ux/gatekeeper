import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isSuperAdmin) redirect("/no-autorizado")

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="superadmin"
        userNombre={session.user.nombre}
        rolLabel="Super Admin"
      />
      <main className="flex-1 overflow-auto bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
