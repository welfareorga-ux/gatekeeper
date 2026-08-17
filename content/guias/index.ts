import type { Guia } from "./tipos"
import { guiasOperacion } from "./operacion"
import { guiasGestion } from "./gestion"

export type { Guia, Bloque } from "./tipos"
export { palabras } from "./tipos"

/** Todas las guías publicadas, de la más reciente a la más antigua. */
export const guias: Guia[] = [...guiasOperacion, ...guiasGestion].sort((a, b) =>
  b.actualizado.localeCompare(a.actualizado),
)

export function guiaPorSlug(slug: string): Guia | undefined {
  return guias.find((g) => g.slug === slug)
}

/** Categorías en el orden en que conviene mostrarlas. */
export const categorias: Guia["categoria"][] = [
  "Operación diaria",
  "Normativa",
  "Gestión del condominio",
  "Tecnología",
]

/** Otras guías de la misma categoría, para enlazar al final del artículo. */
export function relacionadas(guia: Guia, limite = 3): Guia[] {
  const mismaCategoria = guias.filter(
    (g) => g.slug !== guia.slug && g.categoria === guia.categoria,
  )
  const resto = guias.filter(
    (g) => g.slug !== guia.slug && g.categoria !== guia.categoria,
  )
  return [...mismaCategoria, ...resto].slice(0, limite)
}
