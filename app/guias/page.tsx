import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Clock, ArrowRight } from "lucide-react"
import { guias, categorias, descripcionCategoria } from "@/content/guias"

const BASE = "https://www.gatekeeper-app.org"

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

/** Rutas de lectura: cada una resuelve la situación desde la que suele llegar el lector. */
const rutas: { situacion: string; texto: string; slugs: string[] }[] = [
  {
    situacion: "Acabas de asumir la administración",
    texto:
      "Conviene entender cómo debería funcionar la puerta antes de cambiar nada, y revisar qué datos está acumulando hoy el condominio sin que nadie lo haya decidido.",
    slugs: ["control-de-visitas-en-condominios", "datos-personales-de-visitas-en-peru"],
  },
  {
    situacion: "El cuaderno ya no da abasto",
    texto:
      "El síntoma suele ser el reparto a domicilio y las discusiones en hora punta. Primero dónde falla el registro en papel, después el protocolo que corta los pleitos repetidos.",
    slugs: [
      "cuaderno-de-visitas-por-que-falla",
      "protocolo-para-el-vigilante",
      "delivery-proveedores-y-taxis",
    ],
  },
  {
    situacion: "Vas a proponer un cambio a la junta",
    texto:
      "Aquí la parte técnica pesa menos que la presentación y los números. Arma el argumento, define qué vas a medir y llega a la demo sabiendo qué preguntar.",
    slugs: [
      "aprobar-un-sistema-en-la-junta-de-propietarios",
      "indicadores-de-control-de-accesos",
      "elegir-software-de-control-de-visitas",
    ],
  },
]

function tituloDe(slug: string): string {
  return guias.find((g) => g.slug === slug)?.titulo ?? slug
}

export default function GuiasPage() {
  // Datos estructurados: esto no es una página de producto sino una colección de
  // artículos. El ItemList le da a Google el contenido y el orden del índice.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guías de control de accesos para condominios",
    description: metadata.description,
    url: `${BASE}/guias`,
    inLanguage: "es-PE",
    publisher: { "@type": "Organization", name: "Gatekeeper" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: guias.length,
      itemListElement: guias.map((guia, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE}/guias/${guia.slug}`,
        name: guia.titulo,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Casi todo lo que se publica sobre seguridad en condominios habla de
            cámaras y de cercos eléctricos. En la práctica, la mayoría de los
            problemas de un edificio con vigilancia no vienen de que falte
            equipamiento, sino de que nadie escribió las reglas: el vigilante nuevo
            no sabe si puede dejar pasar a la señora que dice ser la hermana del
            1102, el reparto a domicilio entra por costumbre sin que nadie lo haya
            autorizado, y el cuaderno con doscientos nombres solo se consulta el día
            que hay que buscar uno.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Estas {guias.length} guías tratan justamente eso. Son independientes
            entre sí, están escritas para el contexto peruano —incluida la Ley 29733
            de protección de datos personales— y ninguna exige un software concreto:
            casi todo lo que proponen se puede aplicar con un cuaderno ordenado y un
            acuerdo de junta. Cuando hay una decisión de herramienta de por medio,
            está dicho abiertamente en la guía correspondiente.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Por dónde empezar</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">
            No hace falta leerlas en orden. Estas son las tres situaciones desde las
            que suele llegar alguien a esta página:
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {rutas.map((ruta) => (
              <div key={ruta.situacion} className="rounded-lg bg-muted/40 p-5">
                <h3 className="font-semibold leading-snug">{ruta.situacion}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {ruta.texto}
                </p>
                <ul className="mt-4 space-y-2">
                  {ruta.slugs.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/guias/${slug}`}
                        className="text-sm text-primary hover:underline leading-snug"
                      >
                        {tituloDe(slug)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {categorias.map((categoria) => {
          const deLaCategoria = guias.filter((g) => g.categoria === categoria)
          if (deLaCategoria.length === 0) return null

          return (
            <section key={categoria} className="mt-14">
              <h2 className="text-xl font-bold tracking-tight">{categoria}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">
                {descripcionCategoria[categoria]}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

        <section className="mt-16 max-w-2xl border-t pt-8">
          <h2 className="text-xl font-bold tracking-tight">
            Cómo se escriben estas guías
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Las escribe el equipo de Gatekeeper a partir del trabajo con condominios
            y edificios de oficinas en el Perú: turnos de garita observados,
            protocolos que se cayeron al segundo mes y objeciones que aparecen de
            verdad en una asamblea de propietarios. Cuando una guía cita una norma,
            la cita con nombre; cuando propone un número, explica de dónde sale.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Cada artículo lleva su fecha de última actualización y se revisa si
            cambia la práctica que describe. Si administras un condominio y algo aquí
            no coincide con tu realidad —o falta un caso que se te presenta seguido—
            nos sirve saberlo: escribe a{" "}
            <a
              href="mailto:soporte@gatekeeper-app.org"
              className="text-primary hover:underline"
            >
              soporte@gatekeeper-app.org
            </a>
            .
          </p>
        </section>
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
