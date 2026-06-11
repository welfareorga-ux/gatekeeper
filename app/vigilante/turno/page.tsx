import { TurnoCliente } from "./turno-cliente"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"

export const metadata = { title: "Mi Turno — Gatekeeper" }

export default async function TurnoPage() {
  const session = await getServerSession(authOptions)
  const condominioId = session?.user.condominioId
  if (!condominioId) redirect("/login")
  const vigilanteId = session!.user.id

  const { turnoActivo, ultimosTurnos } = await withTenant(condominioId, async (tx) => {
    const turnoActivo = await tx.turnoVigilante.findFirst({
      where: { vigilanteId, activo: true },
    })

    const ultimosTurnos = await tx.turnoVigilante.findMany({
      where: { vigilanteId },
      orderBy: { horaInicioTurno: "desc" },
      take: 5,
    })
    return { turnoActivo, ultimosTurnos }
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Turno</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registra el inicio y fin de cada turno de vigilancia.
        </p>
      </div>
      <TurnoCliente
        turnoActivo={turnoActivo ? {
          id: turnoActivo.id,
          inicio: turnoActivo.horaInicioTurno.toISOString(),
        } : null}
        ultimosTurnos={ultimosTurnos.map((t) => ({
          id: t.id,
          inicio: t.horaInicioTurno.toISOString(),
          fin: t.horaFinTurno?.toISOString() ?? null,
          activo: t.activo,
        }))}
      />
    </div>
  )
}
