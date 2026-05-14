import { TurnoCliente } from "./turno-cliente"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Mi Turno — Gatekeeper" }

export default async function TurnoPage() {
  const session = await getServerSession(authOptions)

  const turnoActivo = await prisma.turnoVigilante.findFirst({
    where: { vigilanteId: session!.user.id, activo: true },
  })

  const ultimosTurnos = await prisma.turnoVigilante.findMany({
    where: { vigilanteId: session!.user.id },
    orderBy: { horaInicioTurno: "desc" },
    take: 5,
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
