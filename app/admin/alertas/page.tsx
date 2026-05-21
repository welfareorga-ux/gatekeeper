import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Car, User, Clock } from "lucide-react"
import { formatFechaHora } from "@/lib/utils"

export const metadata = { title: "Alertas — Gatekeeper Admin" }

export default async function AlertasPage() {
  const session = await getServerSession(authOptions)
  const condominioId = session?.user.condominioId

  const alertas = await prisma.logActividad.findMany({
    where: { accion: "EMERGENCIA_INGRESO", user: { condominioId } },
    include: { user: { select: { nombre: true } } },
    orderBy: { timestamp: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alertas de Emergencia</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ingresos registrados manualmente por vigilantes fuera del flujo normal.
          </p>
        </div>
        {alertas.length > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {alertas.length} registro{alertas.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {alertas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium">Sin alertas registradas</p>
            <p className="text-sm text-muted-foreground mt-1">No hay ingresos de emergencia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            let detalle: Record<string, string> = {}
            try { detalle = JSON.parse(alerta.detalle ?? "{}") } catch { /* noop */ }

            return (
              <Card key={alerta.id} className="border-destructive/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <CardTitle className="text-sm font-medium text-destructive">
                        Ingreso de Emergencia
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatFechaHora(alerta.timestamp)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {detalle.placa && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Placa</p>
                          <p className="font-mono font-bold">{detalle.placa}</p>
                        </div>
                      </div>
                    )}
                    {detalle.visitante && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Visitante</p>
                          <p className="font-medium">{detalle.visitante}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vigilante</p>
                        <p className="font-medium">{detalle.vigilante ?? alerta.user.nombre}</p>
                      </div>
                    </div>
                  </div>
                  {detalle.descripcion && (
                    <div className="rounded-md bg-muted px-3 py-2 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                      <p>{detalle.descripcion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
