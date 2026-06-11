import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CalendarCheck, Clock, History, PlusCircle, Car } from "lucide-react"
import { formatFechaHora } from "@/lib/utils"
import { EstadoBadge } from "@/components/visitas/estado-badge"

export const metadata = { title: "Dashboard — Gatekeeper" }

// Server component — datos directamente de Prisma
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)!
  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
  const condominioId = session?.user.condominioId
  if (!condominioId) redirect("/login")
  const residenteId = session!.user.id

  const [visitasHoy, visitasPendientes, visitasRecientes, totalMes] = await withTenant(condominioId, (tx) => Promise.all([
    tx.visita.count({
      where: {
        residenteId,
        fechaProgramada: { gte: inicioDia, lte: finDia },
      },
    }),
    tx.visita.count({
      where: { residenteId, estado: "PENDIENTE" },
    }),
    tx.visita.findMany({
      where: { residenteId },
      include: { vehiculos: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    tx.visita.count({
      where: {
        residenteId,
        createdAt: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        },
      },
    }),
  ]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buenos días, {session!.user.nombre.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hoy.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Button asChild>
          <Link href="/residente/nueva-visita">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva visita
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitas hoy</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{visitasHoy}</p>
            <p className="text-xs text-muted-foreground mt-1">programadas para hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{visitasPendientes}</p>
            <p className="text-xs text-muted-foreground mt-1">por confirmar ingreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este mes</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMes}</p>
            <p className="text-xs text-muted-foreground mt-1">visitas registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial reciente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Visitas recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/residente/historial">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {visitasRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Car className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Aún no tienes visitas registradas</p>
              <Button variant="link" size="sm" asChild className="mt-2">
                <Link href="/residente/nueva-visita">Registrar primera visita</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {visitasRecientes.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{v.nombreVisitante}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {v.vehiculos[0] && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {v.vehiculos[0].placa}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatFechaHora(v.horaInicio)}
                      </span>
                    </div>
                  </div>
                  <EstadoBadge estado={v.estado} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
