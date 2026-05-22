import { z } from "zod"
import { normalizarPlacaInput, validarPlaca, dniSchema } from "./placa"

export const vehiculoSchema = z.object({
  placa: z
    .string()
    .transform((v) => {
      const t = v.trim()
      return t ? normalizarPlacaInput(t) : ""
    })
    .refine((v) => !v || validarPlaca(v), {
      message: "Placa inválida. Formatos: A1B-234 (nueva), ABC-123 (antigua), A1-2345 (moto)",
    }),
  marca: z.string().max(50).optional().or(z.literal("")),
  modelo: z.string().max(50).optional().or(z.literal("")),
  color: z.string().max(30).optional().or(z.literal("")),
})

export const nuevaVisitaSchema = z.object({
  nombreVisitante: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  dniVisitante: dniSchema,
  motivoVisita: z
    .string()
    .min(3, "El motivo es requerido")
    .max(200, "El motivo es demasiado largo"),
  fechaProgramada: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  vehiculos: z
    .array(vehiculoSchema)
    .max(3, "Máximo 3 vehículos por visita")
    .optional()
    .default([]),
  esRecurrente: z.boolean().optional().default(false),
  guardarComoPlantilla: z.boolean().optional().default(false),
  nombreAlias: z.string().max(80).optional(),
})
  .refine(
    (data) => {
      const [hi, mi] = data.horaInicio.split(":").map(Number)
      const [hf, mf] = data.horaFin.split(":").map(Number)
      return hf * 60 + mf > hi * 60 + mi
    },
    { message: "La hora de fin debe ser mayor a la hora de inicio", path: ["horaFin"] }
  )
  .refine(
    (data) => {
      if (data.guardarComoPlantilla && !data.nombreAlias?.trim()) {
        return false
      }
      return true
    },
    { message: "Ingresa un nombre para la plantilla", path: ["nombreAlias"] }
  )

export type NuevaVisitaInput = z.infer<typeof nuevaVisitaSchema>

export const plantillaSchema = z.object({
  nombreAlias: z.string().min(2, "El nombre es requerido").max(80),
  datosVisitanteJSON: z.object({
    nombreVisitante: z.string(),
    dniVisitante: z.string(),
    motivoVisita: z.string(),
  }),
  datosVehiculoJSON: z.array(
    z.object({ placa: z.string().optional().or(z.literal("")), marca: z.string().optional(), modelo: z.string().optional(), color: z.string().optional() })
  ),
})
