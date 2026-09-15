import { describe, it, expect, vi } from "vitest"
import { repartirPorAntiguedad } from "./degradar-plan"

// degradar-plan importa la base de datos y el correo; para probar la regla
// pura basta con sustituir esos módulos (vi.mock se eleva antes del import).
vi.mock("@/lib/tenant", () => ({ runAsAdmin: vi.fn() }))
vi.mock("@/lib/email", () => ({ enviarEmailPasoAGratis: vi.fn() }))

const u = (id: string, fecha: string) => ({ id, nombre: id, email: `${id}@x.pe`, createdAt: new Date(fecha) })

describe("repartirPorAntiguedad", () => {
  it("conserva los más antiguos y elimina los más recientes", () => {
    const usuarios = [u("c", "2026-03-01"), u("a", "2026-01-01"), u("d", "2026-04-01"), u("b", "2026-02-01")]
    const { conservados, eliminados } = repartirPorAntiguedad(usuarios, 2)
    expect(conservados.map((x) => x.id)).toEqual(["a", "b"])
    expect(eliminados.map((x) => x.id)).toEqual(["c", "d"])
  })

  it("si están dentro del límite no elimina a nadie", () => {
    const { conservados, eliminados } = repartirPorAntiguedad([u("a", "2026-01-01")], 2)
    expect(conservados).toHaveLength(1)
    expect(eliminados).toHaveLength(0)
  })

  it("con la misma fecha de alta desempata por id, siempre igual", () => {
    const misma = "2026-08-31T10:00:00Z"
    const { conservados } = repartirPorAntiguedad([u("z", misma), u("m", misma), u("b", misma)], 1)
    expect(conservados[0].id).toBe("b")
  })
})
