"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Shield, Search, Users, Clock, LogOut, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TopNavProps {
  userNombre: string
  turnoActivo: { id: string; inicio: string } | null
}

export function VigilanteTopNav({ userNombre, turnoActivo }: TopNavProps) {
  const pathname = usePathname()

  const nav = [
    { href: "/vigilante", label: "Buscar", icon: Search, exact: true },
    { href: "/vigilante/dentro", label: "Dentro", icon: Users },
    { href: "/vigilante/turno", label: "Mi Turno", icon: Clock },
  ]

  function horasTurno() {
    if (!turnoActivo) return null
    const minutos = Math.floor((Date.now() - new Date(turnoActivo.inicio).getTime()) / 60000)
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm hidden sm:block">Gatekeeper</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Turno + user */}
        <div className="flex items-center gap-2">
          {turnoActivo ? (
            <Badge variant="success" className="hidden sm:flex gap-1">
              <Clock className="h-3 w-3" />
              {horasTurno()}
            </Badge>
          ) : (
            <Badge variant="warning" className="hidden sm:flex gap-1">
              <AlertTriangle className="h-3 w-3" />
              Sin turno
            </Badge>
          )}
          <span className="text-xs text-muted-foreground hidden md:block max-w-24 truncate">
            {userNombre.split(" ")[0]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
