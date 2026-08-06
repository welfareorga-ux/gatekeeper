"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { VisitaQrDialog } from "@/components/visitas/visita-qr-dialog"
import { EstadoBadge } from "@/components/visitas/estado-badge"
import { formatFechaHora } from "@/lib/utils"
import { Search, QrCode, XCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import type { EstadoVisita } from "@prisma/client"

type Visita = {
  id: string; codigoQR: string; nombreVisitante: string; dniVisitante: string
  motivoVisita: string; horaInicio: string; horaFin: string; estado: EstadoVisita
  createdAt: string
  vehiculos: Array<{ id: string; placa: string; marca?: string; modelo?: string; color?: string }>
  registros?: Array<{ fechaHoraIngreso: string; fechaHoraSalida: string | null }>
}

/** "15:42" a partir de una fecha ISO. */
function soloHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })
}

const ESTADOS: Array<{ value: string; label: string }> = [
  { value: "TODOS", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "INGRESADO", label: "Ingresado" },
  { value: "SALIDO", label: "Salido" },
  { value: "EXPIRADO", label: "Expirado" },
  { value: "CANCELADO", label: "Cancelado" },
]

export function HistorialCliente() {
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [placaFiltro, setPlacaFiltro] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [visitaQR, setVisitaQR] = useState<Visita | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const cargarVisitas = useCallback(async (currentPage = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (estadoFiltro !== "TODOS") params.set("estado", estadoFiltro)
    if (placaFiltro) params.set("placa", placaFiltro)
    if (fechaDesde) params.set("fechaDesde", fechaDesde)
    if (fechaHasta) params.set("fechaHasta", fechaHasta)
    params.set("page", String(currentPage))

    try {
      const res = await fetch(`/api/visitas?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setVisitas(data.visitas)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      toast.error("Error al cargar visitas")
    } finally {
      setLoading(false)
    }
  }, [estadoFiltro, placaFiltro, fechaDesde, fechaHasta])

  // Al cambiar filtros, vuelve a página 1
  useEffect(() => {
    setPage(1)
    cargarVisitas(1)
  }, [cargarVisitas])

  async function cancelarVisita(id: string) {
    try {
      const res = await fetch(`/api/visitas/${id}/cancelar`, { method: "PATCH" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al cancelar")
        return
      }
      toast.success("Visita cancelada")
      cargarVisitas(page)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCancelando(null)
    }
  }

  function irAPagina(p: number) {
    setPage(p)
    cargarVisitas(p)
  }

  function limpiarFiltros() {
    setPlacaFiltro("")
    setEstadoFiltro("TODOS")
    setFechaDesde("")
    setFechaHasta("")
  }

  const hayFiltros = estadoFiltro !== "TODOS" || placaFiltro || fechaDesde || fechaHasta

  return (
    <>
      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="ml-auto h-7 text-xs">
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa..."
              className="pl-9 font-mono"
              value={placaFiltro}
              onChange={(e) => setPlacaFiltro(e.target.value.toUpperCase())}
            />
          </div>

          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
            placeholder="Desde" />
          <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
            placeholder="Hasta" />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : visitas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron visitas</p>
            {hayFiltros && (
              <Button variant="link" size="sm" onClick={limpiarFiltros} className="mt-1">
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitante</TableHead>
                <TableHead>Placa(s)</TableHead>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{v.nombreVisitante}</p>
                    <p className="text-xs text-muted-foreground">{v.motivoVisita}</p>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {v.vehiculos.map((veh) => (
                        <Badge key={veh.id} variant="outline" className="font-mono text-xs">
                          {veh.placa}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm whitespace-nowrap">
                    <p>{formatFechaHora(v.horaInicio)}</p>
                    <p className="text-xs text-muted-foreground">
                      Hasta {new Date(v.horaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </p>
                  </TableCell>

                  <TableCell>
                    <EstadoBadge estado={v.estado} />
                    {v.registros?.[0] && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                          Llegó {soloHora(v.registros[0].fechaHoraIngreso)}
                        </p>
                        {v.registros[0].fechaHoraSalida && (
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            Salió {soloHora(v.registros[0].fechaHoraSalida)}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisitaQR(v)}
                        title="Ver código QR"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {v.estado === "PENDIENTE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCancelando(v.id)}
                          title="Cancelar visita"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Paginación */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>{total} visita{total !== 1 ? "s" : ""} · página {page} de {pages}</span>
            <div className="flex gap-1">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => irAPagina(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page >= pages}
                onClick={() => irAPagina(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Diálogo cancelar */}
      <AlertDialog open={!!cancelando} onOpenChange={(v) => { if (!v) setCancelando(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta visita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La visita pasará a estado CANCELADO
              y el vigilante no podrá registrar el ingreso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancelando && cancelarVisita(cancelando)}
            >
              Sí, cancelar visita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo QR */}
      {visitaQR && (
        <VisitaQrDialog
          open={true}
          onClose={() => setVisitaQR(null)}
          visita={visitaQR}
        />
      )}
    </>
  )
}
