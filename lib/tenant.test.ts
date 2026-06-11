import { describe, it, expect } from "vitest"
import { inyectarTenant, requireCondominioId, tenantWhere, SinCondominioError } from "./tenant"
import type { Session } from "next-auth"

const COND = "cond-abc"
const sesion = (condominioId: string | null) =>
  ({ user: { condominioId } } as unknown as Session)

describe("requireCondominioId / tenantWhere", () => {
  it("devuelve el condominioId de la sesión", () => {
    expect(requireCondominioId(sesion(COND))).toBe(COND)
    expect(tenantWhere(sesion(COND))).toEqual({ condominioId: COND })
  })

  it("lanza SinCondominioError si falta (SuperAdmin / huérfano / sin sesión)", () => {
    expect(() => requireCondominioId(sesion(null))).toThrow(SinCondominioError)
    expect(() => requireCondominioId(null)).toThrow(SinCondominioError)
  })
})

describe("inyectarTenant — modelos tenant", () => {
  it("reads fijan where.condominioId conservando filtros existentes", () => {
    const out = inyectarTenant("Visita", "findMany", { where: { estado: "PENDIENTE" } }, COND)
    expect(out).toEqual({ where: { estado: "PENDIENTE", condominioId: COND } })
  })

  it("findFirst sin where igual recibe condominioId", () => {
    expect(inyectarTenant("Visita", "findFirst", {}, COND)).toEqual({
      where: { condominioId: COND },
    })
  })

  it("count / groupBy / updateMany / deleteMany van por where", () => {
    for (const op of ["count", "groupBy", "updateMany", "deleteMany"]) {
      expect(inyectarTenant("PlantillaVisita", op, { where: {} }, COND)).toEqual({
        where: { condominioId: COND },
      })
    }
  })

  it("create fija data.condominioId", () => {
    const out = inyectarTenant("Visita", "create", { data: { nombreVisitante: "Ana" } }, COND)
    expect(out).toEqual({ data: { nombreVisitante: "Ana", condominioId: COND } })
  })

  it("createMany con array añade condominioId a cada fila", () => {
    const out = inyectarTenant("User", "createMany", { data: [{ email: "a" }, { email: "b" }] }, COND)
    expect(out).toEqual({
      data: [
        { email: "a", condominioId: COND },
        { email: "b", condominioId: COND },
      ],
    })
  })

  it("el condominioId inyectado SOBREESCRIBE uno ajeno (no se puede falsear)", () => {
    const out = inyectarTenant("Visita", "findMany", { where: { condominioId: "OTRO" } }, COND)
    expect(out).toMatchObject({ where: { condominioId: COND } })
  })
})

describe("inyectarTenant — casos que NO se tocan", () => {
  it("findUnique/update/delete por id único quedan intactos (where único)", () => {
    for (const op of ["findUnique", "update", "delete", "upsert"]) {
      const args = { where: { id: "x" }, data: { activo: false } }
      expect(inyectarTenant("Visita", op, args, COND)).toBe(args)
    }
  })

  it("modelos sin columna propia no se modifican", () => {
    const args = { where: { id: "x" } }
    for (const model of ["Vehiculo", "RegistroIngreso", "LogActividad", "Condominio"]) {
      expect(inyectarTenant(model, "findMany", args, COND)).toBe(args)
    }
  })

  it("model undefined (operaciones $-level) no se modifica", () => {
    const args = { foo: 1 }
    expect(inyectarTenant(undefined, "findMany", args, COND)).toBe(args)
  })
})
