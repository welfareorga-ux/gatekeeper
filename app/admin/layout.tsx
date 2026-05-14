import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="admin"
        userNombre={session.user.nombre}
        rolLabel="Panel Admin"
      />
      <main className="flex-1 overflow-auto bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
