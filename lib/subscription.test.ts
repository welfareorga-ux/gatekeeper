import { describe, it, expect } from "vitest"
import { resolverEstadoSuscripcion, estaBloqueada, ESTADOS_BLOQUEADOS } from "./subscription"

const DIA = 24 * 60 * 60 * 1000
const ahora = new Date("2026-06-06T12:00:00Z")

describe("resolverEstadoSuscripcion", () => {
  it("trial vigente sigue siendo 'trial' (acceso permitido)", () => {
    const dentroDe14Dias = new Date(ahora.getTime() + 14 * DIA)
    expect(resolverEstadoSuscripcion("trial", dentroDe14Dias, ahora)).toBe("trial")
  })

  it("trial con un día restante sigue vigente", () => {
    const manana = new Date(ahora.getTime() + 1 * DIA)
    expect(resolverEstadoSuscripcion("trial", manana, ahora)).toBe("trial")
  })

  it("trial vencido pasa a 'trial_expirado'", () => {
    const ayer = new Date(ahora.getTime() - 1 * DIA)
    expect(resolverEstadoSuscripcion("trial", ayer, ahora)).toBe("trial_expirado")
  })

  it("trial vencido por segundos también expira", () => {
    const haceUnSegundo = new Date(ahora.getTime() - 1000)
    expect(resolverEstadoSuscripcion("trial", haceUnSegundo, ahora)).toBe("trial_expirado")
  })

  it("en el instante exacto de vencimiento NO expira (vence cuando es estrictamente menor)", () => {
    expect(resolverEstadoSuscripcion("trial", new Date(ahora), ahora)).toBe("trial")
  })

  it("trial sin fecha de fin no expira (queda en 'trial')", () => {
    expect(resolverEstadoSuscripcion("trial", null, ahora)).toBe("trial")
    expect(resolverEstadoSuscripcion("trial", undefined, ahora)).toBe("trial")
  })

  it("estado nulo/indefinido se considera 'activa'", () => {
    expect(resolverEstadoSuscripcion(null, null, ahora)).toBe("activa")
    expect(resolverEstadoSuscripcion(undefined, null, ahora)).toBe("activa")
  })

  it("estados no-trial se devuelven tal cual (la fecha no aplica)", () => {
    const ayer = new Date(ahora.getTime() - 1 * DIA)
    expect(resolverEstadoSuscripcion("activa", ayer, ahora)).toBe("activa")
    expect(resolverEstadoSuscripcion("vencida", null, ahora)).toBe("vencida")
    expect(resolverEstadoSuscripcion("cancelada", ayer, ahora)).toBe("cancelada")
  })

  it("usa la hora real por defecto cuando no se inyecta 'now'", () => {
    const futuroLejano = new Date(Date.now() + 30 * DIA)
    const pasadoLejano = new Date(Date.now() - 30 * DIA)
    expect(resolverEstadoSuscripcion("trial", futuroLejano)).toBe("trial")
    expect(resolverEstadoSuscripcion("trial", pasadoLejano)).toBe("trial_expirado")
  })
})

describe("estaBloqueada", () => {
  it("bloquea trial_expirado, vencida y fallida", () => {
    expect(estaBloqueada("trial_expirado")).toBe(true)
    expect(estaBloqueada("vencida")).toBe(true)
    expect(estaBloqueada("fallida")).toBe(true)
  })

  it("NO bloquea trial vigente ni activa ni cancelada (gracia)", () => {
    expect(estaBloqueada("trial")).toBe(false)
    expect(estaBloqueada("activa")).toBe(false)
    expect(estaBloqueada("cancelada")).toBe(false)
  })

  it("no bloquea estados nulos/indefinidos", () => {
    expect(estaBloqueada(null)).toBe(false)
    expect(estaBloqueada(undefined)).toBe(false)
    expect(estaBloqueada("")).toBe(false)
  })

  it("la lista de bloqueo es exactamente la esperada", () => {
    expect([...ESTADOS_BLOQUEADOS]).toEqual(["vencida", "fallida", "trial_expirado"])
  })
})

describe("flujo completo del trial (creación → vigencia → expiración)", () => {
  it("simula los 14 días: día 0 y día 13 con acceso, día 15 bloqueado", () => {
    const inicio = new Date("2026-06-06T00:00:00Z")
    const trialEndsAt = new Date(inicio.getTime() + 14 * DIA) // como en app/api/registro/route.ts

    const dia0 = resolverEstadoSuscripcion("trial", trialEndsAt, inicio)
    expect(dia0).toBe("trial")
    expect(estaBloqueada(dia0)).toBe(false)

    const dia13 = resolverEstadoSuscripcion("trial", trialEndsAt, new Date(inicio.getTime() + 13 * DIA))
    expect(dia13).toBe("trial")
    expect(estaBloqueada(dia13)).toBe(false)

    const dia15 = resolverEstadoSuscripcion("trial", trialEndsAt, new Date(inicio.getTime() + 15 * DIA))
    expect(dia15).toBe("trial_expirado")
    expect(estaBloqueada(dia15)).toBe(true)
  })
})
