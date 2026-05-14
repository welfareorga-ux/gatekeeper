import { z } from "zod"

// Placa nueva (post-2010): A1B-234
const REGEX_PLACA_NUEVA = /^[A-Z][0-9][A-Z]-[0-9]{3}$/
// Placa antigua: ABC-123
const REGEX_PLACA_ANTIGUA = /^[A-Z]{3}-[0-9]{3}$/
// Placa moto: A1-2345
const REGEX_PLACA_MOTO = /^[A-Z][0-9]-[0-9]{4}$/

export type TipoPlaca = "nueva" | "antigua" | "moto" | "invalida"

export function detectarTipoPlaca(placa: string): TipoPlaca {
  const p = placa.toUpperCase().trim()
  if (REGEX_PLACA_NUEVA.test(p)) return "nueva"
  if (REGEX_PLACA_ANTIGUA.test(p)) return "antigua"
  if (REGEX_PLACA_MOTO.test(p)) return "moto"
  return "invalida"
}

export function validarPlaca(placa: string): boolean {
  return detectarTipoPlaca(placa) !== "invalida"
}

export function normalizarPlacaInput(raw: string): string {
  let p = raw.toUpperCase().replace(/\s/g, "")
  // Insertar guion automáticamente si no tiene
  if (!p.includes("-")) {
    if (/^[A-Z][0-9][A-Z][0-9]{3}$/.test(p)) {
      p = p.slice(0, 3) + "-" + p.slice(3)
    } else if (/^[A-Z]{3}[0-9]{3}$/.test(p)) {
      p = p.slice(0, 3) + "-" + p.slice(3)
    } else if (/^[A-Z][0-9][0-9]{4}$/.test(p)) {
      p = p.slice(0, 2) + "-" + p.slice(2)
    }
  }
  return p
}

export const placaSchema = z
  .string()
  .min(1, "La placa es requerida")
  .transform((v) => normalizarPlacaInput(v))
  .refine(validarPlaca, {
    message: "Placa inválida. Formatos: A1B-234 (nueva), ABC-123 (antigua), A1-2345 (moto)",
  })

export const dniSchema = z
  .string()
  .regex(/^[0-9]{8}$/, "El DNI debe tener exactamente 8 dígitos")
