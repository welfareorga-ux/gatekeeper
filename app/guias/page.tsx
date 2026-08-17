import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Clock, ArrowRight } from "lucide-react"
import { guias, categorias } from "@/content/guias"

export const metadata: Metadata = {
  title: "Guías de control de accesos para condominios",
  description:
    "Guías prácticas sobre control de visitas, protocolos de garita, protección de datos y gestión de condominios en el Perú. Escritas para administradores, juntas de propietarios y personal de vigilancia.",
  alternates: { canonical: "/guias" },
  openGraph: {
    title: "Guías de control de accesos para condominios — Gatekeeper",
    description:
      "Control de visitas, protocolos de puerta, normativa peruana de datos personales y gestión de condominios.",
    url: "/guias",
  },
}

export default function GuiasPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" />
            Gatekeeper
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión →
          </Link>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Guías de control de accesos
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Material práctico para quien administra un condominio, integra una junta
            de propietarios o trabaja en la garita. Está escrito desde los problemas
            que aparecen de verdad en la puerta: quién autoriza, qué se registra, qué
            datos se pueden pedir y cómo evitar que cada turno aplique reglas
            distintas.
          </p>
        </div>

        {categorias.map((categoria) => {
          const deLaCategoria = guias.filter((g) => g.categoria === categoria)
          if (deLaCategoria.length === 0) return null

          return (
            <section key={categoria} className="mt-12">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {categoria}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {deLaCategoria.map((guia) => (
                  <Link
                    key={guia.slug}
                    href={`/guias/${guia.slug}`}
                    className="group rounded-lg border p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                      {guia.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {guia.resumen}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guia.minutos} min de lectura
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Leer <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      <footer className="border-t py-8">
        <div className="container max-w-5xl mx-auto px-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <Link href="/manual" className="hover:text-foreground transition-colors">
            Manual de uso
          </Link>
          <Link href="/registro" className="hover:text-foreground transition-colors">
            Registrar mi condominio
          </Link>
        </div>
      </footer>
    </div>
  )
}
