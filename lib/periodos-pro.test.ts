import { describe, it, expect } from "vitest"
import { PERIODOS_PRO, CLAVES_PERIODO, periodoPorMonto,precioMensualEquivalente, textoRenovacion } from "./periodos-pro"

describe("PERIODOS_PRO", () => {
  it("cada periodo largo sale más barato por mes que el anterior", () => {
    const porMes = CLAVES_PERIODO.map((p) => PERIODOS_PRO[p].amount / PERIODOS_PRO[p].meses)
    for (let i = 1; i < porMes.length; i++) expect(porMes[i]).toBeLessThan(porMes[i - 1])
  })

  it("los códigos de Culqi son únicos", () => {
    const codigos = CLAVES_PERIODO.map((p) => PERIODOS_PRO[p].codigoCulqi)
    expect(new Set(codigos).size).toBe(codigos.length)
  })
})

describe("helpers", () => {
  it("equivalente mensual", () => {
    expect(precioMensualEquivalente("mensual")).toBe("S/ 89.00")
    expect(precioMensualEquivalente("semestral")).toBe("S/ 80.00")
    expect(precioMensualEquivalente("anual")).toBe("S/ 74.17")
  })

  it("texto de renovación", () => {
    expect(textoRenovacion("mensual")).toBe("cada mes")
    expect(textoRenovacion("trimestral")).toBe("cada 3 meses")
    expect(textoRenovacion("anual")).toBe("cada año")
  })

  it("periodo por monto", () => {
    expect(periodoPorMonto(89000)).toBe("anual")
    expect(periodoPorMonto(8900)).toBe("mensual")
    expect(periodoPorMonto(4900)).toBeNull()
    expect(periodoPorMonto(null)).toBeNull()
  })

  it("los montos son únicos (se usan para identificar el periodo)", () => {
    const montos = CLAVES_PERIODO.map((p) => PERIODOS_PRO[p].amount)
    expect(new Set(montos).size).toBe(montos.length)
  })
})
