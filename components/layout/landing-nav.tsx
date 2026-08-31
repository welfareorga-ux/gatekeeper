"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Menu, Shield } from "lucide-react"

/**
 * Navegación pública del sitio. Se usa en la portada y en todas las páginas
 * abiertas (guías, manual) para que el contenido sea alcanzable desde
 * cualquiera de ellas y no solo desde el pie de página.
 *
 * Los enlaces de sección apuntan a "/#ancla" a propósito: así funcionan igual
 * desde la portada que desde una guía.
 */
const ENLACES = [
  { href: "/guias", label: "Guías" },
  { href: "/manual", label: "Manual" },
  { href: "/#planes", label: "Planes" },
] as const

export function LandingNav() {
  return (
    <>
      {/* Escritorio */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
        {ENLACES.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {enlace.label}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        <Link href="/login">
          <Button variant="ghost" size="sm">Iniciar sesión</Button>
        </Link>
        <Link href="/registro">
          <Button size="sm">Registrar mi condominio</Button>
        </Link>
      </nav>

      {/* Móvil */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <nav aria-label="Navegación principal" className="flex flex-col h-full pt-8">
              <div className="flex items-center gap-2 px-4 pb-6 border-b">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Gatekeeper</span>
              </div>

              <div className="flex flex-col px-4 pt-4">
                {ENLACES.map((enlace) => (
                  <SheetClose asChild key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="py-3 text-base font-medium border-b last:border-b-0 hover:text-primary transition-colors"
                    >
                      {enlace.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              <div className="flex flex-col gap-3 px-4 pt-6">
                <SheetClose asChild>
                  <Link href="/login">
                    <Button variant="outline" className="w-full" size="lg">
                      Iniciar sesión
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/registro">
                    <Button className="w-full" size="lg">
                      Registrar mi condominio
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
