import type { MetadataRoute } from "next"
import { guias } from "@/content/guias"

const BASE = "https://www.gatekeeper-app.org"

/** Solo las páginas públicas con contenido propio. */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date()
  const rutas: Array<{ ruta: string; prioridad: number; frecuencia: "weekly" | "monthly" }> = [
    { ruta: "/", prioridad: 1.0, frecuencia: "weekly" },
    { ruta: "/manual", prioridad: 0.8, frecuencia: "monthly" },
    { ruta: "/guias", prioridad: 0.9, frecuencia: "weekly" },
    { ruta: "/registro", prioridad: 0.6, frecuencia: "monthly" },
    { ruta: "/libro-reclamaciones", prioridad: 0.3, frecuencia: "monthly" },
    { ruta: "/politica-devoluciones", prioridad: 0.3, frecuencia: "monthly" },
  ]
  const fijas: MetadataRoute.Sitemap = rutas.map(({ ruta, prioridad, frecuencia }) => ({
    url: `${BASE}${ruta}`,
    lastModified: ahora,
    changeFrequency: frecuencia,
    priority: prioridad,
  }))

  const articulos: MetadataRoute.Sitemap = guias.map((g) => ({
    url: `${BASE}/guias/${g.slug}`,
    lastModified: new Date(g.actualizado),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...fijas, ...articulos]
}
