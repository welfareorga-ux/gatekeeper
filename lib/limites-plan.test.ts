import { describe, it, expect } from "vitest"
import {
  corteConservarEmpresas, diasRestantesMesLima, fechaCorteHistorial, fechaLimaTexto, finGraciaCobro, finDeMesLimaTexto, inicioMesLima, limiteUsuarios,
  saldoExtraVigente, visitasUsadasEsteMes, LIMITES_GRATIS,
} from "./limites-plan"

describe("inicioMesLima", () => {
  it("devuelve el día 1 a las 00:00 de Lima (05:00 UTC)", () => {
    expect(inicioMesLima(new Date("2026-09-14T15:00:00Z")).toISOString()).toBe("2026-09-01T05:00:00.000Z")
  })

  it("la noche del último día en Lima sigue siendo el mes anterior aunque en UTC ya sea el siguiente", () => {
    // 30 sep 22:00 en Lima = 1 oct 03:00 UTC
    expect(inicioMesLima(new Date("2026-10-01T03:00:00Z")).toISOString()).toBe("2026-09-01T05:00:00.000Z")
  })

  it("a medianoche del día 1 en Lima ya empieza el mes nuevo", () => {
    expect(inicioMesLima(new Date("2026-10-01T05:00:00Z")).toISOString()).toBe("2026-10-01T05:00:00.000Z")
  })

  it("cruza el cambio de año", () => {
    // 31 dic 23:30 en Lima = 1 ene 04:30 UTC
    expect(inicioMesLima(new Date("2027-01-01T04:30:00Z")).toISOString()).toBe("2026-12-01T05:00:00.000Z")
    expect(inicioMesLima(new Date("2027-01-01T05:00:00Z")).toISOString()).toBe("2027-01-01T05:00:00.000Z")
  })
})

describe("plazos de gracia y conservación de empresas", () => {
  it("la gracia de un cobro fallido dura 5 días", () => {
    expect(finGraciaCobro(new Date("2026-09-15T18:00:00Z")).toISOString()).toBe("2026-09-20T18:00:00.000Z")
  })

  it("las empresas se conservan 30 días tras pasar a Gratis", () => {
    expect(corteConservarEmpresas(new Date("2026-10-15T12:00:00Z")).toISOString()).toBe("2026-09-15T12:00:00.000Z")
  })

  it("la fecha para correos va en hora de Lima", () => {
    // 21 set 02:00 UTC = 20 set 21:00 en Lima
    expect(fechaLimaTexto(new Date("2026-09-21T02:00:00Z"))).toBe("20 de setiembre")
  })
})

describe("fechaCorteHistorial", () => {
  it("conserva exactamente los últimos 30 días", () => {
    expect(fechaCorteHistorial(new Date("2026-09-14T15:00:00Z")).toISOString()).toBe("2026-08-15T15:00:00.000Z")
  })
})

describe("visitasUsadasEsteMes", () => {
  const ahora = new Date("2026-09-14T15:00:00Z")

  it("usa el contador si es del mes en curso", () => {
    expect(visitasUsadasEsteMes({ visitasMes: 7, visitasMesInicio: new Date("2026-09-01T05:00:00Z") }, ahora)).toBe(7)
  })

  it("un contador de un mes anterior cuenta como cero", () => {
    expect(visitasUsadasEsteMes({ visitasMes: 12, visitasMesInicio: new Date("2026-08-01T05:00:00Z") }, ahora)).toBe(0)
  })

  it("sin contador iniciado cuenta como cero", () => {
    expect(visitasUsadasEsteMes({ visitasMes: 0, visitasMesInicio: null }, ahora)).toBe(0)
  })
})

describe("paquete de visitas extra", () => {
  const ahora = new Date("2026-09-14T15:00:00Z")
  const inicioSep = new Date("2026-09-01T05:00:00Z")

  it("el saldo comprado este mes se puede usar", () => {
    expect(saldoExtraVigente({ visitasExtra: 20, visitasExtraInicio: inicioSep }, ahora)).toBe(20)
  })

  it("el saldo de un mes anterior ya venció", () => {
    expect(saldoExtraVigente({ visitasExtra: 20, visitasExtraInicio: new Date("2026-08-01T05:00:00Z") }, ahora)).toBe(0)
  })

  it("sin compra no hay saldo", () => {
    expect(saldoExtraVigente({ visitasExtra: 0, visitasExtraInicio: null }, ahora)).toBe(0)
  })

  it("vence a medianoche de Lima del último día", () => {
    // 30 sep 23:00 en Lima = 1 oct 04:00 UTC: todavía septiembre
    expect(saldoExtraVigente({ visitasExtra: 5, visitasExtraInicio: inicioSep }, new Date("2026-10-01T04:00:00Z"))).toBe(5)
    expect(saldoExtraVigente({ visitasExtra: 5, visitasExtraInicio: inicioSep }, new Date("2026-10-01T05:00:00Z"))).toBe(0)
  })

  it("texto y días hasta fin de mes", () => {
    // es-PE escribe "setiembre", la forma usada en Perú.
    expect(finDeMesLimaTexto(ahora)).toBe("30 de setiembre")
    expect(finDeMesLimaTexto(new Date("2027-02-10T15:00:00Z"))).toBe("28 de febrero")
    expect(diasRestantesMesLima(new Date("2026-09-30T15:00:00Z"))).toBe(1)
    expect(diasRestantesMesLima(new Date("2026-09-01T06:00:00Z"))).toBe(30)
  })
})

describe("limiteUsuarios", () => {
  it("aplica los límites del plan Gratis", () => {
    expect(limiteUsuarios("GRATIS", "RESIDENTE")).toBe(LIMITES_GRATIS.residentes)
    expect(limiteUsuarios("GRATIS", "VIGILANTE")).toBe(LIMITES_GRATIS.vigilantes)
  })

  it("Pro no tiene límite comercial", () => {
    expect(limiteUsuarios("PRO", "RESIDENTE")).toBe(Infinity)
    expect(limiteUsuarios("PRO", "VIGILANTE")).toBe(Infinity)
  })
})
