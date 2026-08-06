"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, Users, ShieldCheck, Trash2, Search } from "lucide-react"
import { formatFecha } from "@/lib/utils"

type Rol = "ADMIN" | "VIGILANTE" | "RESIDENTE"

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  isSuperAdmin: boolean
  condominioId: string | null
  createdAt: string
  condominio: { nombre: string } | null
}

const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  VIGILANTE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  RESIDENTE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}
const ROL_LABEL: Record<string, string> = { ADMIN: "Admin", VIGILANTE: "Vigilante", RESIDENTE: "Residente" }

export function UsuariosCliente() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCondo, setFiltroCondo] = useState<string>("todos")
  const [aEliminar, setAEliminar] = useState<Usuario | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/usuarios")
      if (!res.ok) throw new Error()
      setUsuarios(await res.json())
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const condominios = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of usuarios) {
      if (u.condominioId) map.set(u.condominioId, u.condominio?.nombre ?? "—")
    }
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [usuarios])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter((u) => {
      if (filtroCondo !== "todos" && u.condominioId !== filtroCondo) return false
      if (q && !u.nombre.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [usuarios, busqueda, filtroCondo])

  async function eliminar() {
    if (!aEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/superadmin/usuarios/${aEliminar.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Error al eliminar"); return }
      toast.success(`Usuario ${aEliminar.nombre} eliminado`)
      setUsuarios((prev) => prev.filter((x) => x.id !== aEliminar.id))
      setAEliminar(null)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminando(false)
    }
  }

  const totalAdmins = usuarios.filter((u) => u.rol === "ADMIN" && !u.isSuperAdmin).length

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total usuarios", value: usuarios.length, icon: Users },
          { label: "Administradores", value: totalAdmins, icon: ShieldCheck },
          { label: "Organizaciones", value: condominios.length, icon: Users },
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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre o email…"
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Select value={filtroCondo} onValueChange={setFiltroCondo}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las organizaciones</SelectItem>
              {condominios.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={cargar}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sin usuarios</TableCell></TableRow>
              ) : (
                filtrados.map((u) => (
                  <TableRow key={u.id} className={!u.activo ? "opacity-50" : ""}>
                    <TableCell>
                      <p className="font-medium flex items-center gap-2">
                        {u.nombre}
                        {u.isSuperAdmin && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Super</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ROL_COLOR[u.rol]}`}>{ROL_LABEL[u.rol] ?? u.rol}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{u.condominio?.nombre ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center text-sm">{u.activo ? "Sí" : "No"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatFecha(u.createdAt)}</TableCell>
                    <TableCell>
                      {!u.isSuperAdmin && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Eliminar usuario"
                          onClick={() => setAEliminar(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!aEliminar} onOpenChange={(v) => { if (!v) setAEliminar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar usuario
            </DialogTitle>
          </DialogHeader>
          {aEliminar && (
            <div className="space-y-3 text-sm">
              <p>
                Vas a eliminar a <strong>{aEliminar.nombre}</strong> ({aEliminar.email}),
                rol <strong>{ROL_LABEL[aEliminar.rol] ?? aEliminar.rol}</strong>
                {aEliminar.condominio?.nombre ? <> de la organización <strong>{aEliminar.condominio.nombre}</strong></> : null}.
              </p>
              <p className="text-muted-foreground">
                Se borrarán también sus datos asociados (visitas, plantillas, turnos y registros de actividad).
                Esta acción no se puede deshacer.
              </p>
              {aEliminar.rol === "ADMIN" && (
                <p className="rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-400 px-3 py-2 text-xs">
                  ⚠️ Es un <strong>administrador</strong>. Si es el único de su organización, esta quedará sin nadie que la gestione.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminar} disabled={eliminando}>
              {eliminando ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
