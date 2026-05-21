"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Menu, Shield } from "lucide-react"

export function LandingNav() {
  return (
    <>
      {/* Desktop nav — oculto en mobile */}
      <div className="hidden sm:flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm">Iniciar sesión</Button>
        </Link>
        <Link href="/registro">
          <Button size="sm">Registrar mi condominio</Button>
        </Link>
      </div>

      {/* Mobile nav — solo visible en mobile */}
      <div className="sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col h-full pt-8">
              <div className="flex items-center gap-2 px-4 pb-6 border-b">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Gatekeeper</span>
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
