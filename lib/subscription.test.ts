import { describe, it, expect } from "vitest"
import { resolverEstadoSuscripcion, estaBloqueada, ESTADOS_BLOQUEADOS } from "./subscription"

describe("resolverEstadoSuscripcion", () => {
  it("el plan GRATIS siempre está activo, sin importar el estado guardado", () => {
    expect(resolverEstadoSuscripcion("activa", "GRATIS")).toBe("activa")
    expect(resolverEstadoSuscripcion("vencida", "GRATIS")).toBe("activa")
    expect(resolverEstadoSuscripcion("fallida", "GRATIS")).toBe("activa")
    expect(resolverEstadoSuscripcion("cancelada", "GRATIS")).toBe("activa")
  })

  it("el plan GRATIS no caduca aunque el estado sea nulo", () => {
    expect(resolverEstadoSuscripcion(null, "GRATIS")).toBe("activa")
    expect(resolverEstadoSuscripcion(undefined, "GRATIS")).toBe("activa")
  })

  it("en PRO se respeta el estado guardado", () => {
    expect(resolverEstadoSuscripcion("activa", "PRO")).toBe("activa")
    expect(resolverEstadoSuscripcion("vencida", "PRO")).toBe("vencida")
    expect(resolverEstadoSuscripcion("fallida", "PRO")).toBe("fallida")
    expect(resolverEstadoSuscripcion("cancelada", "PRO")).toBe("cancelada")
  })

  it("estado nulo/indefinido se considera 'activa'", () => {
    expect(resolverEstadoSuscripcion(null)).toBe("activa")
    expect(resolverEstadoSuscripcion(undefined)).toBe("activa")
    expect(resolverEstadoSuscripcion(null, "PRO")).toBe("activa")
  })

  it("sin plan indicado se comporta como PRO (no asume gratuidad)", () => {
    expect(resolverEstadoSuscripcion("vencida")).toBe("vencida")
    expect(resolverEstadoSuscripcion("fallida", null)).toBe("fallida")
  })
})

describe("estaBloqueada", () => {
  it("bloquea vencida y fallida", () => {
    expect(estaBloqueada("vencida")).toBe(true)
    expect(estaBloqueada("fallida")).toBe(true)
  })

  it("NO bloquea activa ni cancelada (cancelada tiene gracia hasta fin de periodo)", () => {
    expect(estaBloqueada("activa")).toBe(false)
    expect(estaBloqueada("cancelada")).toBe(false)
  })

  it("ya no existe el estado de prueba expirada", () => {
    expect(estaBloqueada("trial_expirado")).toBe(false)
    expect(estaBloqueada("trial")).toBe(false)
  })

  it("no bloquea estados nulos/indefinidos", () => {
    expect(estaBloqueada(null)).toBe(false)
    expect(estaBloqueada(undefined)).toBe(false)
    expect(estaBloqueada("")).toBe(false)
  })

  it("la lista de bloqueo es exactamente la esperada", () => {
    expect([...ESTADOS_BLOQUEADOS]).toEqual(["vencida", "fallida"])
  })
})

describe("flujo de una cuenta gratuita", () => {
  it("una cuenta GRATIS nunca queda bloqueada", () => {
    for (const guardado of ["activa", "cancelada", "vencida", "fallida", null]) {
      const estado = resolverEstadoSuscripcion(guardado, "GRATIS")
      expect(estaBloqueada(estado)).toBe(false)
    }
  })

  it("al pasar a PRO, un cobro fallido sí bloquea", () => {
    const estado = resolverEstadoSuscripcion("fallida", "PRO")
    expect(estaBloqueada(estado)).toBe(true)
  })
})
