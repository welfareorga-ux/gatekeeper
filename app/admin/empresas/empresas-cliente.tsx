"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Plus, RefreshCw, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { formatFecha } from "@/lib/utils"

type Empresa = {
  id: string
  nombre: string
  activo: boolean
  createdAt: string
  _count: { usuarios: number }
}

export function EmpresasCliente() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [nueva, setNueva] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [aEditar, setAEditar] = useState<Empresa | null>(null)
  const [nombreEdit, setNombreEdit] = useState("")
  const [aEliminar, setAEliminar] = useState<Empresa | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/empresas")
      if (!res.ok) throw new Error()
      setEmpresas(await res.json())
    } catch {
      toast.error("Error al cargar las empresas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (nueva.trim().length < 2) return
    setGuardando(true)
    try {
      const res = await fetch("/api/admin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nueva.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al crear"); return }
      setEmpresas((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNueva("")
      toast.success(`Empresa "${data.nombre}" creada`)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(emp: Empresa) {
    const nuevo = !emp.activo
    setEmpresas((prev) => prev.map((x) => x.id === emp.id ? { ...x, activo: nuevo } : x))
    try {
      const res = await fetch(`/api/admin/empresas/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevo }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Empresa ${nuevo ? "activada" : "desactivada"}`)
    } catch {
      toast.error("Error al actualizar")
      setEmpresas((prev) => prev.map((x) => x.id === emp.id ? { ...x, activo: emp.activo } : x))
    }
  }

  async function renombrar() {
    if (!aEditar || nombreEdit.trim().length < 2) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/empresas/${aEditar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreEdit.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al renombrar"); return }
      setEmpresas((prev) => prev.map((x) => x.id === aEditar.id ? { ...x, nombre: data.nombre } : x)
        .sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setAEditar(null)
      toast.success("Empresa renombrada")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!aEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/admin/empresas/${aEliminar.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Error al eliminar"); return }
      setEmpresas((prev) => prev.filter((x) => x.id !== aEliminar.id))
      toast.success(
        data.usuarios > 0
          ? `Empresa eliminada. ${data.usuarios} usuario(s) quedaron sin empresa.`
          : "Empresa eliminada",
      )
      setAEliminar(null)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={crear} className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="space-y-1.5 flex-1 max-w-sm">
          <Label>Nueva empresa</Label>
          <Input
            placeholder="Ej. Estudio Contable Lima SAC"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={guardando || nueva.trim().length < 2}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
          <Button type="button" variant="ghost" onClick={cargar}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : empresas.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">Sin empresas registradas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega una arriba solo si tu edificio aloja varias empresas.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Residentes</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-center">Activa</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((emp) => (
                <TableRow key={emp.id} className={!emp.activo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{emp.nombre}</TableCell>
                  <TableCell className="text-sm">{emp._count.usuarios}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatFecha(emp.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={emp.activo} onCheckedChange={() => toggleActivo(emp)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title="Renombrar"
                        onClick={() => { setAEditar(emp); setNombreEdit(emp.nombre) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Eliminar"
                        onClick={() => setAEliminar(emp)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!aEditar} onOpenChange={(v) => { if (!v) setAEditar(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Renombrar empresa</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} maxLength={80} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEditar(null)}>Cancelar</Button>
            <Button onClick={renombrar} disabled={guardando || nombreEdit.trim().length < 2}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aEliminar} onOpenChange={(v) => { if (!v) setAEliminar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar empresa
            </DialogTitle>
          </DialogHeader>
          {aEliminar && (
            <div className="space-y-3 text-sm">
              <p>Vas a eliminar <strong>{aEliminar.nombre}</strong>.</p>
              {aEliminar._count.usuarios > 0 ? (
                <p className="rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs">
                  Sus <strong>{aEliminar._count.usuarios}</strong> residente(s) NO se eliminan:
                  quedan como &ldquo;sin empresa&rdquo;. Sus visitas tampoco se pierden.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">No tiene residentes asignados.</p>
              )}
              <p className="text-muted-foreground text-xs">
                Si solo quieres dejar de usarla, desactívala en vez de eliminarla.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminar} disabled={eliminando}>
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
