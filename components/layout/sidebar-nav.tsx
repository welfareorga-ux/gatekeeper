"use client"

import type { ElementType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet"
import {
  LogOut, Shield, Menu,
  LayoutDashboard, Users, BarChart3, ScrollText, AlertTriangle,
  PlusCircle, History, BookMarked, Building2, CreditCard,
} from "lucide-react"

const NAV_ITEMS = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/empresas", label: "Empresas", icon: Building2 },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
    { href: "/admin/alertas", label: "Alertas", icon: AlertTriangle },
    { href: "/admin/suscripcion", label: "Suscripción y Servicios", icon: CreditCard },
  ],
  residente: [
    { href: "/residente/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/residente/nueva-visita", label: "Nueva Visita", icon: PlusCircle },
    { href: "/residente/historial", label: "Historial", icon: History },
    { href: "/residente/plantillas", label: "Plantillas", icon: BookMarked },
  ],
  superadmin: [
    { href: "/superadmin/condominios", label: "Organizaciones", icon: Building2 },
    { href: "/superadmin/usuarios", label: "Usuarios", icon: Users },
  ],
}

interface SidebarNavProps {
  variant: keyof typeof NAV_ITEMS
  userNombre: string
  userDireccion?: string
  rolLabel: string
}

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: { href: string; label: string; icon: ElementType }[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  )
}

function LogoHeader({ rolLabel }: { rolLabel: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b">
      <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
        <Shield className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="font-semibold text-sm leading-none">Gatekeeper</p>
        <p className="text-xs text-muted-foreground mt-0.5">{rolLabel}</p>
      </div>
    </div>
  )
}

function UserFooter({ userNombre, userDireccion }: { userNombre: string; userDireccion?: string }) {
  return (
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
  )
}

export function SidebarNav({ variant, userNombre, userDireccion, rolLabel }: SidebarNavProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[variant]

  return (
    <>
      {/* Desktop sidebar — oculto en mobile */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r bg-card shrink-0">
        <LogoHeader rolLabel={rolLabel} />
        <NavItems items={items} pathname={pathname} />
        <UserFooter userNombre={userNombre} userDireccion={userDireccion} />
      </aside>

      {/* Mobile top bar — solo visible en mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 border-b bg-card">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col h-full">
              <div className="pt-2">
                <LogoHeader rolLabel={rolLabel} />
              </div>
              <NavItems items={items} pathname={pathname} />
              <UserFooter userNombre={userNombre} userDireccion={userDireccion} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-lg">
            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Gatekeeper</span>
        </div>
      </div>
    </>
  )
}
