"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { formatFechaHora } from "@/lib/utils"

type LogEntry = {
  id: string
  accion: string
  detalle: string | null
  ip: string | null
  timestamp: string
  user: { nombre: string; rol: string }
}

const ACCION_LABEL: Record<string, string> = {
  CREAR_VISITA: "Nueva visita",
  CANCELAR_VISITA: "Visita cancelada",
  REGISTRAR_INGRESO: "Ingreso",
  REGISTRAR_SALIDA: "Salida",
  INICIAR_TURNO: "Turno iniciado",
  FINALIZAR_TURNO: "Turno finalizado",
  EMERGENCIA_INGRESO: "Emergencia",
  CREAR_USUARIO: "Usuario creado",
  ACTUALIZAR_USUARIO: "Usuario actualizado",
  RESET_PASSWORD: "Reset contraseña",
}

const ACCION_BADGE: Record<string, string> = {
  EMERGENCIA_INGRESO: "destructive",
  REGISTRAR_INGRESO: "success",
  REGISTRAR_SALIDA: "warning",
  CREAR_USUARIO: "info",
}

const ACCIONES_FILTRO = [
  "TODAS",
  "CREAR_VISITA",
  "CANCELAR_VISITA",
  "REGISTRAR_INGRESO",
  "REGISTRAR_SALIDA",
  "INICIAR_TURNO",
  "FINALIZAR_TURNO",
  "EMERGENCIA_INGRESO",
  "CREAR_USUARIO",
  "ACTUALIZAR_USUARIO",
  "RESET_PASSWORD",
]

export function AuditoriaCliente() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [filtroAccion, setFiltroAccion] = useState("TODAS")
  const [filtroBuscar, setFiltroBuscar] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  const cargar = useCallback(
    async (p = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(p) })
        if (filtroAccion !== "TODAS") params.set("accion", filtroAccion)
        if (filtroDesde) params.set("desde", filtroDesde)
        if (filtroHasta) params.set("hasta", filtroHasta)
        const res = await fetch(`/api/admin/logs?${params}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
        setPage(data.page)
        setPages(data.pages)
      } catch {
        toast.error("Error al cargar logs")
      } finally {
        setLoading(false)
      }
    },
    [filtroAccion, filtroDesde, filtroHasta]
  )

  useEffect(() => {
    cargar(1)
  }, [cargar])

  const logsVisibles = filtroBuscar
    ? logs.filter(
        (l) =>
          l.user.nombre.toLowerCase().includes(filtroBuscar.toLowerCase()) ||
          l.accion.toLowerCase().includes(filtroBuscar.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Input
            placeholder="Buscar usuario o acción…"
            value={filtroBuscar}
            onChange={(e) => setFiltroBuscar(e.target.value)}
            className="w-52"
          />
        </div>
        <Select value={filtroAccion} onValueChange={(v) => { setFiltroAccion(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCIONES_FILTRO.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "TODAS" ? "Todas las acciones" : (ACCION_LABEL[a] ?? a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Desde</span>
          <Input
            type="date"
            value={filtroDesde}
            onChange={(e) => { setFiltroDesde(e.target.value); setPage(1) }}
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Hasta</span>
          <Input
            type="date"
            value={filtroHasta}
            onChange={(e) => { setFiltroHasta(e.target.value); setPage(1) }}
            className="w-36"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => cargar(page)} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} registro{total !== 1 ? "s" : ""} · Página {page} de {Math.max(1, pages)}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Fecha y hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-24">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsVisibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Sin registros
                  </TableCell>
                </TableRow>
              ) : (
                logsVisibles.map((log) => {
                  const badgeVariant = ACCION_BADGE[log.accion] as "destructive" | "success" | "warning" | "info" | undefined
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFechaHora(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{log.user.nombre}</p>
                        <p className="text-xs text-muted-foreground">{log.user.rol}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant ?? "outline"} className="text-xs whitespace-nowrap">
                          {ACCION_LABEL[log.accion] ?? log.accion.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {log.detalle ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ip ?? "—"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => cargar(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pages}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => cargar(page + 1)}
            disabled={page >= pages || loading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
