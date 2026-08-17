/**
 * Modelo de contenido de las guías.
 *
 * Se guarda como datos tipados en vez de MDX a propósito: sin dependencias
 * nuevas, sin HTML suelto que se pueda romper, y con la estructura obligada
 * (títulos, listas, tablas) que hace falta para que Google entienda de qué
 * trata cada artículo.
 */
export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "numerada"; items: string[] }
  | { tipo: "nota"; texto: string }
  | { tipo: "tabla"; encabezados: string[]; filas: string[][] }

export interface Guia {
  /** Parte final de la URL: /guias/{slug} */
  slug: string
  titulo: string
  /** Se usa como meta description y como entradilla del artículo. */
  resumen: string
  categoria: "Operación diaria" | "Normativa" | "Gestión del condominio" | "Tecnología"
  minutos: number
  /** ISO. Se muestra al lector y alimenta el dato structured data. */
  actualizado: string
  bloques: Bloque[]
}

/** Cuenta aproximada de palabras de un artículo, para el tiempo de lectura. */
export function palabras(guia: Guia): number {
  return guia.bloques.reduce((total, b) => {
    if (b.tipo === "lista" || b.tipo === "numerada") {
      return total + b.items.join(" ").split(/\s+/).length
    }
    if (b.tipo === "tabla") {
      return total + [...b.encabezados, ...b.filas.flat()].join(" ").split(/\s+/).length
    }
    return total + b.texto.split(/\s+/).length
  }, 0)
}
