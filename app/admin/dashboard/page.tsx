import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Car, Clock, FileText, ShieldCheck } from "lucide-react"
import { formatFechaHora } from "@/lib/utils"

export const metadata = { title: "Dashboard Admin — Gatekeeper" }

const ACCION_LABEL: Record<string, string> = {
  CREAR_VISITA: "Nueva visita",
  CANCELAR_VISITA: "Visita cancelada",
  REGISTRAR_INGRESO: "Ingreso registrado",
  REGISTRAR_SALIDA: "Salida registrada",
  INICIAR_TURNO: "Turno iniciado",
  FINALIZAR_TURNO: "Turno finalizado",
  EMERGENCIA_INGRESO: "Ingreso de emergencia",
  CREAR_USUARIO: "Usuario creado",
  ACTUALIZAR_USUARIO: "Usuario actualizado",
  RESET_PASSWORD: "Contraseña reseteada",
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [
    totalResidentes,
    totalVigilantes,
    visitasHoy,
    vehiculosDentro,
    turnosActivos,
    ultimosLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { rol: "RESIDENTE", activo: true } }),
    prisma.user.count({ where: { rol: "VIGILANTE", activo: true } }),
    prisma.visita.count({ where: { createdAt: { gte: hoy } } }),
    prisma.registroIngreso.count({ where: { fechaHoraSalida: null } }),
    prisma.turnoVigilante.count({ where: { activo: true } }),
    prisma.logActividad.findMany({
      take: 15,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { nombre: true, rol: true } } },
    }),
  ])

  const stats = [
    { label: "Residentes activos", value: totalResidentes, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Vigilantes activos", value: totalVigilantes, icon: ShieldCheck, color: "text-purple-500 bg-purple-500/10" },
    { label: "Visitas hoy", value: visitasHoy, icon: FileText, color: "text-green-500 bg-green-500/10" },
    { label: "Vehículos dentro", value: vehiculosDentro, icon: Car, color: "text-orange-500 bg-orange-500/10" },
    { label: "Turnos activos", value: turnosActivos, icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido, {session?.user.nombre}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const [textColor, bgColor] = s.color.split(" ")
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                <div className={`p-1.5 rounded-md ${bgColor}`}>
                  <Icon className={`h-4 w-4 ${textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {ultimosLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Sin actividad registrada</p>
          ) : (
            ultimosLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between px-6 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACCION_LABEL[log.accion] ?? log.accion.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{log.user.nombre}</p>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {log.user.rol}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{formatFechaHora(log.timestamp)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
