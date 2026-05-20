"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LogOut, Shield,
  LayoutDashboard, Users, BarChart3, ScrollText, AlertTriangle,
  PlusCircle, History, BookMarked, Building2, CreditCard,
} from "lucide-react"

const NAV_ITEMS = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
    { href: "/admin/alertas", label: "Alertas", icon: AlertTriangle },
    { href: "/admin/suscripcion", label: "Suscripción", icon: CreditCard },
  ],
  residente: [
    { href: "/residente/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/residente/nueva-visita", label: "Nueva Visita", icon: PlusCircle },
    { href: "/residente/historial", label: "Historial", icon: History },
    { href: "/residente/plantillas", label: "Plantillas", icon: BookMarked },
  ],
  superadmin: [
    { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/condominios", label: "Condominios", icon: Building2 },
  ],
}

interface SidebarNavProps {
  variant: keyof typeof NAV_ITEMS
  userNombre: string
  userDireccion?: string
  rolLabel: string
}

export function SidebarNav({ variant, userNombre, userDireccion, rolLabel }: SidebarNavProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[variant]

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">Gatekeeper</p>
          <p className="text-xs text-muted-foreground mt-0.5">{rolLabel}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{userNombre}</p>
          {userDireccion && (
            <p className="text-xs text-muted-foreground truncate">{userDireccion}</p>
          )}
        </div>
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
