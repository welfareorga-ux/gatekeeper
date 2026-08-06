"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Building2, Users, FileText, KeyRound, Trash2 } from "lucide-react"
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
  const [modalReset, setModalReset] = useState<Condominio | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [aEliminar, setAEliminar] = useState<Condominio | null>(null)
  const [confirmNombre, setConfirmNombre] = useState("")
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/condominios")
      if (!res.ok) throw new Error()
      setCondominios(await res.json())
    } catch {
      toast.error("Error al cargar organizaciones")
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
      toast.success(`Organización ${nuevo ? "activada" : "desactivada"}`)
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

  async function resetAdminPassword() {
    if (!modalReset || newPassword.length < 8) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/superadmin/condominios/${modalReset.id}/reset-admin-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al resetear"); return }
      toast.success(`Contraseña de ${data.adminNombre} actualizada`)
      setModalReset(null)
      setNewPassword("")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCondominio() {
    if (!aEliminar || confirmNombre.trim() !== aEliminar.nombre) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/superadmin/condominios/${aEliminar.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Error al eliminar"); return }
      toast.success(`Organización "${aEliminar.nombre}" eliminada (${data.usuarios} usuarios, ${data.visitas} visitas)`)
      setCondominios((prev) => prev.filter((x) => x.id !== aEliminar.id))
      setAEliminar(null)
      setConfirmNombre("")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminando(false)
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
          { label: "Organizaciones activas", value: activos, icon: Building2 },
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
        <p className="text-sm text-muted-foreground">{condominios.length} organización{condominios.length !== 1 ? "es" : ""} registrada{condominios.length !== 1 ? "s" : ""}</p>
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
                <TableHead>Organización</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condominios.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sin organizaciones registradas</TableCell></TableRow>
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Resetear contraseña del admin"
                          onClick={() => { setModalReset(c); setNewPassword("") }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Eliminar organización"
                          onClick={() => { setAEliminar(c); setConfirmNombre("") }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!modalReset} onOpenChange={(v) => { if (!v) setModalReset(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Resetear contraseña del admin
            </DialogTitle>
          </DialogHeader>
          {modalReset && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Organización: <strong>{modalReset.nombre}</strong>
              </p>
              <div className="space-y-1.5">
                <Label>Nueva contraseña</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-xs text-destructive">{newPassword.length}/8 caracteres</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Comunica la nueva contraseña al administrador por teléfono o WhatsApp.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalReset(null)}>Cancelar</Button>
            <Button onClick={resetAdminPassword} disabled={guardando || newPassword.length < 8}>
              {guardando ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aEliminar} onOpenChange={(v) => { if (!v) { setAEliminar(null); setConfirmNombre("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar organización
            </DialogTitle>
          </DialogHeader>
          {aEliminar && (
            <div className="space-y-3 text-sm">
              <p>
                Vas a eliminar <strong>{aEliminar.nombre}</strong> y <strong>TODO</strong> lo que contiene:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                <li><strong>{aEliminar._count.usuarios}</strong> usuario(s): administradores, vigilantes y residentes</li>
                <li><strong>{aEliminar._count.visitas}</strong> visita(s) y sus vehículos/registros</li>
                <li>Plantillas, turnos y registros de actividad de la organización</li>
              </ul>
              <p className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-xs">
                ⚠️ Esta acción es <strong>permanente e irreversible</strong>. No hay papelera ni forma de recuperar los datos.
              </p>
              <div className="space-y-1.5">
                <Label>Para confirmar, escribe el nombre de la organización:</Label>
                <Input
                  placeholder={aEliminar.nombre}
                  value={confirmNombre}
                  onChange={(e) => setConfirmNombre(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAEliminar(null); setConfirmNombre("") }}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={eliminarCondominio}
              disabled={eliminando || !aEliminar || confirmNombre.trim() !== aEliminar.nombre}
            >
              {eliminando ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
