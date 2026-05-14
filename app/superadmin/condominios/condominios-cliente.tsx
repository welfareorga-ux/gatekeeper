"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Building2, Users, FileText } from "lucide-react"
import { formatFecha } from "@/lib/utils"

type Condominio = {
  id: string
  nombre: string
  direccion: string | null
  email: string | null
  plan: "BASICO" | "ESTANDAR" | "PREMIUM"
  activo: boolean
  createdAt: string
  _count: { usuarios: number; visitas: number }
}

const PLAN_COLOR: Record<string, string> = {
  BASICO: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  ESTANDAR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PREMIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
}

export function CondominiosCliente() {
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/condominios")
      if (!res.ok) throw new Error()
      setCondominios(await res.json())
    } catch {
      toast.error("Error al cargar condominios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function toggleActivo(c: Condominio) {
    const nuevo = !c.activo
    setCondominios((prev) => prev.map((x) => x.id === c.id ? { ...x, activo: nuevo } : x))
    try {
      const res = await fetch(`/api/superadmin/condominios/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevo }),
      })
      if (!res.ok) {
        toast.error("Error al actualizar")
        setCondominios((prev) => prev.map((x) => x.id === c.id ? { ...x, activo: c.activo } : x))
        return
      }
      toast.success(`Condominio ${nuevo ? "activado" : "desactivado"}`)
    } catch {
      toast.error("Error de conexión")
      setCondominios((prev) => prev.map((x) => x.id === c.id ? { ...x, activo: c.activo } : x))
    }
  }

  async function cambiarPlan(c: Condominio, plan: string) {
    try {
      const res = await fetch(`/api/superadmin/condominios/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) { toast.error("Error al actualizar plan"); return }
      setCondominios((prev) => prev.map((x) => x.id === c.id ? { ...x, plan: plan as Condominio["plan"] } : x))
      toast.success("Plan actualizado")
    } catch {
      toast.error("Error de conexión")
    }
  }

  // Stats
  const activos = condominios.filter((c) => c.activo).length
  const totalUsuarios = condominios.reduce((a, c) => a + c._count.usuarios, 0)
  const totalVisitas = condominios.reduce((a, c) => a + c._count.visitas, 0)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Condominios activos", value: activos, icon: Building2 },
          { label: "Total usuarios", value: totalUsuarios, icon: Users },
          { label: "Total visitas", value: totalVisitas, icon: FileText },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border p-4 flex items-center gap-4">
              <Icon className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{condominios.length} condominio{condominios.length !== 1 ? "s" : ""} registrados</p>
        <Button variant="ghost" size="sm" onClick={cargar}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condominio</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-center">Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condominios.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sin condominios registrados</TableCell></TableRow>
              ) : (
                condominios.map((c) => (
                  <TableRow key={c.id} className={!c.activo ? "opacity-50" : ""}>
                    <TableCell>
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.direccion ?? "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm">{c._count.usuarios}</TableCell>
                    <TableCell className="text-sm">{c._count.visitas}</TableCell>
                    <TableCell>
                      <Select value={c.plan} onValueChange={(v) => cambiarPlan(c, v)}>
                        <SelectTrigger className={`h-7 w-28 text-xs border ${PLAN_COLOR[c.plan]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASICO">Básico</SelectItem>
                          <SelectItem value="ESTANDAR">Estándar</SelectItem>
                          <SelectItem value="PREMIUM">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatFecha(c.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={c.activo} onCheckedChange={() => toggleActivo(c)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
