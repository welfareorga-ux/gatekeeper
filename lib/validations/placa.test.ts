import { describe, it, expect } from "vitest"
import { validarPlaca, detectarTipoPlaca, normalizarPlacaInput } from "./placa"

describe("detectarTipoPlaca", () => {
  it("detecta placa nueva (A1B-234)", () => {
    expect(detectarTipoPlaca("A1B-234")).toBe("nueva")
    expect(detectarTipoPlaca("Z9Z-999")).toBe("nueva")
    expect(detectarTipoPlaca("B2C-001")).toBe("nueva")
  })

  it("detecta placa antigua (ABC-123)", () => {
    expect(detectarTipoPlaca("ABC-123")).toBe("antigua")
    expect(detectarTipoPlaca("LIM-001")).toBe("antigua")
    expect(detectarTipoPlaca("ZZZ-999")).toBe("antigua")
  })

  it("detecta placa de moto (A1-2345)", () => {
    expect(detectarTipoPlaca("A1-2345")).toBe("moto")
    expect(detectarTipoPlaca("Z9-9999")).toBe("moto")
  })

  it("rechaza placas inválidas", () => {
    expect(detectarTipoPlaca("")).toBe("invalida")
    expect(detectarTipoPlaca("1AB-234")).toBe("invalida")
    expect(detectarTipoPlaca("AB-1234")).toBe("invalida")
    expect(detectarTipoPlaca("A1B234")).toBe("invalida")
    expect(detectarTipoPlaca("A1B-2345")).toBe("invalida")
    expect(detectarTipoPlaca("ABC-1234")).toBe("invalida")
    expect(detectarTipoPlaca("ABCD-123")).toBe("invalida")
    expect(detectarTipoPlaca("A1B-23")).toBe("invalida")
  })

  it("es insensible a mayúsculas", () => {
    expect(detectarTipoPlaca("a1b-234")).toBe("nueva")
    expect(detectarTipoPlaca("abc-123")).toBe("antigua")
    expect(detectarTipoPlaca("a1-2345")).toBe("moto")
  })
})

describe("validarPlaca", () => {
  it("retorna true para placas válidas", () => {
    expect(validarPlaca("A1B-234")).toBe(true)
    expect(validarPlaca("ABC-123")).toBe(true)
    expect(validarPlaca("A1-2345")).toBe(true)
  })

  it("retorna false para placas inválidas", () => {
    expect(validarPlaca("")).toBe(false)
    expect(validarPlaca("123-456")).toBe(false)
    expect(validarPlaca("INVALID")).toBe(false)
  })
})

describe("normalizarPlacaInput", () => {
  it("inserta guion en placa nueva sin guion", () => {
    expect(normalizarPlacaInput("A1B234")).toBe("A1B-234")
  })

  it("inserta guion en placa antigua sin guion", () => {
    expect(normalizarPlacaInput("ABC123")).toBe("ABC-123")
  })

  it("inserta guion en placa moto sin guion", () => {
    expect(normalizarPlacaInput("A12345")).toBe("A1-2345")
  })

  it("convierte a mayúsculas", () => {
    expect(normalizarPlacaInput("a1b-234")).toBe("A1B-234")
  })

  it("elimina espacios e inserta guion", () => {
    expect(normalizarPlacaInput("A1B 234")).toBe("A1B-234")
  })

  it("no modifica placa con guion ya insertado", () => {
    expect(normalizarPlacaInput("A1B-234")).toBe("A1B-234")
    expect(normalizarPlacaInput("ABC-123")).toBe("ABC-123")
  })

  it("no modifica input inválido que no matchea patrones", () => {
    expect(normalizarPlacaInput("XYZ")).toBe("XYZ")
  })
})
