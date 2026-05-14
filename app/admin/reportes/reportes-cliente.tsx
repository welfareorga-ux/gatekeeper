"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Download, FileSpreadsheet, RefreshCw, TrendingUp } from "lucide-react"

type DiaDato = { fecha: string; total: number; ingresados: number; cancelados: number }
type ResidenteDato = { nombre: string; direccion: string; total: number }
type VehiculoDato = { placa: string; marca: string | null; modelo: string | null; color: string | null; total: number; visitantes: string; residentes: string }
type PermanenciaDato = { fecha: string; promedio: number; cantidad: number }

type DatosReportes = {
  visitasPorDia: DiaDato[]
  visitasPorResidente: ResidenteDato[]
  vehiculosFrecuentes: VehiculoDato[]
  tiempoPermanencia: PermanenciaDato[]
}

function formatMinutos(min: number): string {
  if (min === 0) return "—"
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function ReportesCliente() {
  const [dias, setDias] = useState("30")
  const [datos, setDatos] = useState<DatosReportes | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`/api/reportes/visitas-por-dia?dias=${dias}`).then((r) => r.json()),
        fetch(`/api/reportes/visitas-por-residente?dias=${dias}`).then((r) => r.json()),
        fetch(`/api/reportes/vehiculos-frecuentes?dias=${dias}`).then((r) => r.json()),
        fetch(`/api/reportes/tiempo-permanencia?dias=${dias}`).then((r) => r.json()),
      ])
      setDatos({
        visitasPorDia: r1,
        visitasPorResidente: r2,
        vehiculosFrecuentes: r3,
        tiempoPermanencia: r4,
      })
    } catch {
      toast.error("Error al cargar reportes")
    } finally {
      setLoading(false)
    }
  }, [dias])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function exportarExcel() {
    if (!datos) return
    setExportando(true)
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      const hVisitas = [["Fecha", "Total visitas", "Ingresados", "Cancelados"]]
      const bVisitas = datos.visitasPorDia.map((d) => [d.fecha, d.total, d.ingresados, d.cancelados])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...hVisitas, ...bVisitas]), "Visitas por Día")

      const hResidente = [["Residente", "Dirección", "Total visitas"]]
      const bResidente = datos.visitasPorResidente.map((d) => [d.nombre, d.direccion, d.total])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...hResidente, ...bResidente]), "Por Residente")

      const hVehiculo = [["Placa", "Marca", "Modelo", "Color", "Visitas", "Visitantes", "Residentes"]]
      const bVehiculo = datos.vehiculosFrecuentes.map((d) => [d.placa, d.marca ?? "", d.modelo ?? "", d.color ?? "", d.total, d.visitantes, d.residentes])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...hVehiculo, ...bVehiculo]), "Vehículos Frecuentes")

      const hPermanencia = [["Fecha", "Tiempo promedio (min)", "Cantidad"]]
      const bPermanencia = datos.tiempoPermanencia.map((d) => [d.fecha, d.promedio, d.cantidad])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...hPermanencia, ...bPermanencia]), "Tiempo Permanencia")

      XLSX.writeFile(wb, `reporte-gatekeeper-${dias}d.xlsx`)
      toast.success("Excel descargado")
    } catch {
      toast.error("Error al exportar Excel")
    } finally {
      setExportando(false)
    }
  }

  async function exportarPDF() {
    if (!datos) return
    setExportando(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF()
      const fecha = new Date().toLocaleDateString("es-PE")

      doc.setFontSize(18)
      doc.text("Reporte Gatekeeper", 14, 20)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generado: ${fecha}  ·  Período: últimos ${dias} días`, 14, 28)
      doc.setTextColor(0)

      // Visitas por día
      doc.setFontSize(13)
      doc.text("Visitas por Día", 14, 42)
      autoTable(doc, {
        startY: 46,
        head: [["Fecha", "Total", "Ingresados", "Cancelados"]],
        body: datos.visitasPorDia
          .filter((d) => d.total > 0)
          .map((d) => [d.fecha, d.total, d.ingresados, d.cancelados]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      // Visitas por residente
      const y2 = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(13)
      doc.text("Top Residentes", 14, y2)
      autoTable(doc, {
        startY: y2 + 4,
        head: [["Residente", "Dirección", "Visitas"]],
        body: datos.visitasPorResidente.map((d) => [d.nombre, d.direccion, d.total]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] },
      })

      // Nueva página para vehículos
      doc.addPage()
      doc.setFontSize(13)
      doc.text("Vehículos Más Frecuentes", 14, 20)
      autoTable(doc, {
        startY: 24,
        head: [["Placa", "Marca/Modelo", "Color", "Visitas", "Residente(s)"]],
        body: datos.vehiculosFrecuentes.map((d) => [
          d.placa,
          [d.marca, d.modelo].filter(Boolean).join(" ") || "—",
          d.color ?? "—",
          d.total,
          d.residentes,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 11] },
      })

      // Tiempo de permanencia
      const y4 = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(13)
      doc.text("Tiempo de Permanencia Promedio", 14, y4)
      autoTable(doc, {
        startY: y4 + 4,
        head: [["Fecha", "Promedio", "Registros"]],
        body: datos.tiempoPermanencia
          .filter((d) => d.cantidad > 0)
          .map((d) => [d.fecha, formatMinutos(d.promedio), d.cantidad]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
      })

      doc.save(`reporte-gatekeeper-${dias}d.pdf`)
      toast.success("PDF descargado")
    } catch {
      toast.error("Error al exportar PDF")
    } finally {
      setExportando(false)
    }
  }

  const totalVisitas = datos?.visitasPorDia.reduce((a, d) => a + d.total, 0) ?? 0
  const promedioVisitas = datos ? Math.round(totalVisitas / parseInt(dias)) : 0
  const promedioGeneral = datos
    ? (() => {
        const con = datos.tiempoPermanencia.filter((d) => d.cantidad > 0)
        if (con.length === 0) return 0
        return Math.round(con.reduce((a, d) => a + d.promedio, 0) / con.length)
      })()
    : 0

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarExcel} disabled={exportando || loading || !datos}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} disabled={exportando || loading || !datos}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPIs rápidos */}
      {!loading && datos && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Visitas en período</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalVisitas}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Promedio diario</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{promedioVisitas}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Vehículos únicos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{datos.vehiculosFrecuentes.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Permanencia promedio</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatMinutos(promedioGeneral)}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="dias">
        <TabsList className="mb-4">
          <TabsTrigger value="dias">Visitas / Día</TabsTrigger>
          <TabsTrigger value="residentes">Por Residente</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="permanencia">Permanencia</TabsTrigger>
        </TabsList>

        {/* Tab: Visitas por día */}
        <TabsContent value="dias">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Visitas registradas por día
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datos?.visitasPorDia ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval={Math.floor((parseInt(dias) - 1) / 10)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ingresados" name="Ingresados" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cancelados" name="Cancelados" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Residente */}
        <TabsContent value="residentes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 10 residentes con más visitas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : datos && datos.visitasPorResidente.length === 0 ? (
                <p className="text-center text-muted-foreground py-16 text-sm">Sin datos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={datos?.visitasPorResidente ?? []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      dataKey="nombre"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={120}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(value) => [value ?? 0, "Visitas"]}
                    />
                    <Bar dataKey="total" name="Visitas" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vehículos frecuentes */}
        <TabsContent value="vehiculos">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 20 vehículos más frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !datos || datos.vehiculosFrecuentes.length === 0 ? (
                <p className="text-center text-muted-foreground py-16 text-sm">Sin datos en el período</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead className="text-center">Visitas</TableHead>
                        <TableHead>Visitantes</TableHead>
                        <TableHead>Residente(s)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.vehiculosFrecuentes.map((v, i) => (
                        <TableRow key={v.placa}>
                          <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                          <TableCell className="font-mono font-bold">{v.placa}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[v.marca, v.modelo, v.color].filter(Boolean).join(" · ") || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-bold text-blue-400">{v.total}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                            {v.visitantes || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                            {v.residentes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tiempo de permanencia */}
        <TabsContent value="permanencia">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tiempo promedio de permanencia por día (minutos)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : datos && datos.tiempoPermanencia.every((d) => d.cantidad === 0) ? (
                <p className="text-center text-muted-foreground py-16 text-sm">Sin registros de salida en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={datos?.tiempoPermanencia ?? []}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval={Math.floor((parseInt(dias) - 1) / 10)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(value, _name, props) => {
                        const v = Number(value ?? 0)
                        return [v > 0 ? `${formatMinutos(v)} (${(props as any).payload.cantidad} reg.)` : "Sin datos", "Promedio"]
                      }}
                    />
                    <Bar dataKey="promedio" name="Promedio (min)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
