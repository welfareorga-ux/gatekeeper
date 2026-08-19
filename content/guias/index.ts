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

/** Qué agrupa cada categoría. Se muestra bajo el título de cada bloque del índice. */
export const descripcionCategoria: Record<Guia["categoria"], string> = {
  "Operación diaria":
    "Lo que ocurre en la puerta durante el turno: quién autoriza una visita, qué se le pide al que llega, cómo se resuelve el caso del vecino que discute y qué hacer con el volumen de reparto a domicilio, que en un edificio urbano es hoy el mayor número de ingresos del día. Son las decisiones que el vigilante toma solo, de pie y con cola detrás.",
  Normativa:
    "Un registro de visitas con nombres y documentos es una base de datos personales, y en el Perú la Ley 29733 le aplica igual que a cualquier otra. Aquí está qué se puede pedir, qué conviene no pedir, cuánto tiempo guardarlo y cómo redactar un aviso de privacidad que quepa en un cartel de garita.",
  "Gestión del condominio":
    "El trabajo del administrador y de la junta de propietarios: cómo presentar un cambio para que se apruebe, cómo justificar el gasto ante quienes pagan la cuota y qué medir después para saber si sirvió. La parte que decide si una mejora de seguridad sobrevive a la siguiente asamblea.",
  Tecnología:
    "Cómo elegir y evaluar herramientas sin quedar atrapado en ellas: qué preguntar en una demo, qué funciones se lucen y no se usan, y cómo comprobar antes de firmar que podrás llevarte tus datos si el proveedor deja de convenirte.",
}

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
