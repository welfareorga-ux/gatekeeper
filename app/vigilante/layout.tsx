import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { VigilanteTopNav } from "@/components/vigilante/top-nav"

export default async function VigilanteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol === "RESIDENTE") redirect("/residente/dashboard")

  // Buscar turno activo
  const turnoActivo = await prisma.turnoVigilante.findFirst({
    where: { vigilanteId: session.user.id, activo: true },
    orderBy: { horaInicioTurno: "desc" },
  })

  return (
    // Wrapper dark — siempre oscuro para legibilidad en portería
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      <VigilanteTopNav
        userNombre={session.user.nombre}
        turnoActivo={
          turnoActivo
            ? { id: turnoActivo.id, inicio: turnoActivo.horaInicioTurno.toISOString() }
            : null
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
