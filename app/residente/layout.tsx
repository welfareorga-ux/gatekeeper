import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export default async function ResidenteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol === "VIGILANTE") redirect("/vigilante")

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="residente"
        userNombre={session.user.nombre}
        userDireccion={session.user.direccion}
        rolLabel="Portal Residente"
      />
      <main className="flex-1 overflow-auto bg-background">
        <div className="container max-w-5xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
