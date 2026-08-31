import type { Metadata } from "next"
import Link from "next/link"
import { LandingNav } from "@/components/layout/landing-nav"
import { notFound } from "next/navigation"
import { Shield, Clock, ArrowLeft } from "lucide-react"
import { guias, guiaPorSlug, relacionadas, type Bloque } from "@/content/guias"

const BASE = "https://www.gatekeeper-app.org"

export function generateStaticParams() {
  return guias.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const guia = guiaPorSlug(params.slug)
  if (!guia) return {}
  return {
    title: guia.titulo,
    description: guia.resumen,
    alternates: { canonical: `/guias/${guia.slug}` },
    openGraph: {
      type: "article",
      title: guia.titulo,
      description: guia.resumen,
      url: `/guias/${guia.slug}`,
      publishedTime: guia.actualizado,
    },
  }
}

/** Renderiza un bloque del artículo. */
function Contenido({ bloque }: { bloque: Bloque }) {
  switch (bloque.tipo) {
    case "subtitulo":
      return (
        <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight">{bloque.texto}</h2>
      )
    case "parrafo":
      return <p className="mb-4 leading-relaxed text-muted-foreground">{bloque.texto}</p>
    case "lista":
      return (
        <ul className="mb-4 space-y-2">
          {bloque.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-muted-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case "numerada":
      return (
        <ol className="mb-4 space-y-3">
          {bloque.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-muted-foreground leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      )
    case "nota":
      return (
        <div className="my-6 rounded-lg border-l-4 border-primary bg-muted/50 p-4">
          <p className="text-sm leading-relaxed">{bloque.texto}</p>
        </div>
      )
    case "tabla":
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                {bloque.encabezados.map((h, i) => (
                  <th key={i} className="py-2 pr-4 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloque.filas.map((fila, i) => (
                <tr key={i} className="border-b last:border-0">
                  {fila.map((celda, j) => (
                    <td key={j} className="py-3 pr-4 align-top text-muted-foreground">
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export default function GuiaPage({ params }: { params: { slug: string } }) {
  const guia = guiaPorSlug(params.slug)
  if (!guia) notFound()

  const otras = relacionadas(guia)

  // Datos estructurados: le dicen a Google que esto es un artículo con autor y
  // fecha, no una página de producto más.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.titulo,
    description: guia.resumen,
    datePublished: guia.actualizado,
    dateModified: guia.actualizado,
    author: { "@type": "Organization", name: "Gatekeeper" },
    publisher: { "@type": "Organization", name: "Gatekeeper" },
    mainEntityOfPage: `${BASE}/guias/${guia.slug}`,
    inLanguage: "es-PE",
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b">
        <div className="container max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" />
            Gatekeeper
          </Link>
          <LandingNav />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/guias"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las guías
        </Link>

        <article className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            {guia.categoria}
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {guia.titulo}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {guia.resumen}
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guia.minutos} min de lectura
            </span>
            <span>
              Actualizado el{" "}
              {new Date(guia.actualizado).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mt-10">
            {guia.bloques.map((bloque, i) => (
              <Contenido key={i} bloque={bloque} />
            ))}
          </div>
        </article>

        {otras.length > 0 && (
          <section className="mt-14 border-t pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Seguir leyendo
            </h2>
            <div className="mt-4 space-y-3">
              {otras.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guias/${g.slug}`}
                  className="block rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <div className="font-medium">{g.titulo}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{g.resumen}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-lg border bg-muted/40 p-6">
          <h2 className="font-semibold">Gatekeeper</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Estas guías las escribimos desde lo que vemos en condominios reales.
            Gatekeeper es el sistema con el que un residente autoriza a su visita
            antes de que llegue y la garita registra el ingreso en segundos. Tiene un
            plan gratuito, sin tarjeta.
          </p>
          <Link
            href="/registro"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Registrar mi condominio →
          </Link>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container max-w-3xl mx-auto px-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <Link href="/guias" className="hover:text-foreground transition-colors">
            Guías
          </Link>
          <Link href="/manual" className="hover:text-foreground transition-colors">
            Manual de uso
          </Link>
        </div>
      </footer>
    </div>
  )
}
