"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, KeyRound, Pencil, Search, Trash2 } from "lucide-react"
import { formatFecha } from "@/lib/utils"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Usuario = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: "RESIDENTE" | "VIGILANTE" | "ADMIN"
  direccion: string | null
  activo: boolean
  createdAt: string
  empresaId?: string | null
  empresa?: { nombre: string } | null
}

interface Limite { actual: number; max: number }

interface Props {
  usuariosIniciales: Usuario[]
  limites: { plan: string; residentes: Limite; vigilantes: Limite }
}

const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  VIGILANTE: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  RESIDENTE: "bg-green-500/10 text-green-400 border border-green-500/20",
}

const FORM_INICIAL = { nombre: "", email: "", password: "", rol: "RESIDENTE", telefono: "", direccion: "", empresaId: "" }

/** Valor centinela del <Select>: shadcn no admite SelectItem con value="". */
const SIN_EMPRESA = "__sin_empresa__"

type EmpresaOpcion = { id: string; nombre: string; activo: boolean }

export function UsuariosCliente({ usuariosIniciales, limites }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales)
  const [filtroRol, setFiltroRol] = useState("TODOS")
  const [buscar, setBuscar] = useState("")

  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null)
  const [modalReset, setModalReset] = useState<Usuario | null>(null)
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null)

  const [form, setForm] = useState(FORM_INICIAL)
  // Lista de empresas para el selector. Si no hay ninguna, el campo ni aparece.
  const [empresas, setEmpresas] = useState<EmpresaOpcion[]>([])
  const [newPassword, setNewPassword] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const filtrados = usuarios.filter((u) => {
    if (filtroRol !== "TODOS" && u.rol !== filtroRol) return false
    if (buscar && !u.nombre.toLowerCase().includes(buscar.toLowerCase()) && !u.email.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  async function toggleActivo(u: Usuario) {
    const nuevo = !u.activo
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: nuevo } : x)))
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevo }),
      })
      if (!res.ok) {
        toast.error((await res.json()).error ?? "Error al actualizar")
        setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: u.activo } : x)))
        return
      }
      toast.success(`Usuario ${nuevo ? "activado" : "desactivado"}`)
    } catch {
      toast.error("Error de conexión")
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: u.activo } : x)))
    }
  }

  useEffect(() => {
    fetch("/api/admin/empresas")
      .then((r) => (r.ok ? r.json() : []))
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
  }, [])

  async function crearUsuario() {
    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      toast.error("Nombre, email y contraseña son requeridos")
      return
    }
    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // La empresa solo aplica a residentes y es opcional.
        body: JSON.stringify({
          ...form,
          empresaId: form.rol === "RESIDENTE" && form.empresaId ? form.empresaId : null,
        }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Error al crear"); return }
      const nuevo: Usuario = { ...(await res.json()), telefono: form.telefono || null, direccion: form.direccion || null }
      setUsuarios((prev) => [...prev, nuevo])
      toast.success("Usuario creado correctamente")
      setModalCrear(false)
      setForm(FORM_INICIAL)
    } catch { toast.error("Error de conexión") }
    finally { setGuardando(false) }
  }

  async function editarUsuario() {
    if (!modalEditar) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalEditar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: modalEditar.nombre,
          email: modalEditar.email,
          telefono: modalEditar.telefono,
          direccion: modalEditar.direccion,
          // Solo los residentes tienen empresa; null = quitar la asignacion.
          ...(modalEditar.rol === "RESIDENTE" ? { empresaId: modalEditar.empresaId ?? null } : {}),
        }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Error al actualizar"); return }
      const actualizado = await res.json()
      const empresa = empresas.find((e) => e.id === actualizado.empresaId)
      setUsuarios((prev) => prev.map((u) => (
        u.id === actualizado.id
          ? { ...u, ...actualizado, empresa: empresa ? { nombre: empresa.nombre } : null }
          : u
      )))
      toast.success("Usuario actualizado")
      setModalEditar(null)
    } catch { toast.error("Error de conexión") }
    finally { setGuardando(false) }
  }

  async function eliminarUsuario() {
    if (!modalEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalEliminar.id}`, { method: "DELETE" })
      if (!res.ok) { toast.error((await res.json()).error ?? "Error al eliminar"); return }
      setUsuarios((prev) => prev.filter((u) => u.id !== modalEliminar.id))
      toast.success(`${modalEliminar.nombre} eliminado correctamente`)
      setModalEliminar(null)
    } catch { toast.error("Error de conexión") }
    finally { setEliminando(false) }
  }

  async function resetPassword() {
    if (!modalReset || newPassword.length < 8) { toast.error("Mínimo 8 caracteres"); return }
    setGuardando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${modalReset.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Error al resetear"); return }
      toast.success("Contraseña actualizada")
      setModalReset(null)
      setNewPassword("")
    } catch { toast.error("Error de conexión") }
    finally { setGuardando(false) }
  }

  return (
    <>
      {/* Filtros + botón nuevo */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre o email…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroRol} onValueChange={setFiltroRol}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los roles</SelectItem>
              <SelectItem value="RESIDENTE">Residentes</SelectItem>
              <SelectItem value="VIGILANTE">Vigilantes</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm(FORM_INICIAL); setModalCrear(true) }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>{filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}</span>
        <span className="text-border">|</span>
        <span>
          Residentes:{" "}
          <span className={limites.residentes.actual >= limites.residentes.max ? "text-destructive font-medium" : "font-medium text-foreground"}>
            {limites.residentes.actual}
          </span>
          {limites.residentes.max !== Infinity && ` / ${limites.residentes.max}`}
        </span>
        <span>
          Vigilantes:{" "}
          <span className={limites.vigilantes.actual >= limites.vigilantes.max ? "text-destructive font-medium" : "font-medium text-foreground"}>
            {limites.vigilantes.actual}
          </span>
          {limites.vigilantes.max !== Infinity && ` / ${limites.vigilantes.max}`}
        </span>
        <span className="text-xs">— Plan {limites.plan.charAt(0) + limites.plan.slice(1).toLowerCase()}</span>
      </div>

      {/* Tabla */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((u) => (
                <TableRow key={u.id} className={!u.activo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_COLOR[u.rol]}`}>
                      {u.rol}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                    <p className="truncate">{u.direccion ?? "—"}</p>
                    {u.empresa?.nombre && (
                      <p className="truncate text-xs text-primary/80">{u.empresa.nombre}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatFecha(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={u.activo} onCheckedChange={() => toggleActivo(u)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8" title="Editar"
                        onClick={() => setModalEditar({ ...u })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8" title="Resetear contraseña"
                        onClick={() => { setModalReset(u); setNewPassword("") }}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.rol !== "ADMIN" && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar usuario"
                          onClick={() => setModalEliminar(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Crear */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Juan Pérez García" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="juan@ejemplo.com" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Contraseña *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-xs text-destructive">Mínimo 8 caracteres ({form.password.length}/8)</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select value={form.rol} onValueChange={(v) => setForm((p) => ({ ...p, rol: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIDENTE">Residente</SelectItem>
                  <SelectItem value="VIGILANTE">Vigilante</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="9XXXXXXXX" />
            </div>
            {form.rol === "RESIDENTE" && (
              <div className="col-span-2 space-y-1.5">
                <Label>Dirección / Unidad</Label>
                <Input value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Torre A, Dpto 301" />
              </div>
            )}
            {form.rol === "RESIDENTE" && empresas.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label>Empresa <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Select
                  value={form.empresaId || SIN_EMPRESA}
                  onValueChange={(v) => setForm((p) => ({ ...p, empresaId: v === SIN_EMPRESA ? "" : v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_EMPRESA}>Sin empresa</SelectItem>
                    {empresas.filter((e) => e.activo).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Solo si el edificio aloja varias empresas. Gestiona la lista en Empresas.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCrear(false)}>Cancelar</Button>
            <Button onClick={crearUsuario} disabled={guardando}>{guardando ? "Creando…" : "Crear usuario"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!modalEditar} onOpenChange={(v) => { if (!v) setModalEditar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {modalEditar && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre completo</Label>
                <Input value={modalEditar.nombre} onChange={(e) => setModalEditar((p) => p ? { ...p, nombre: e.target.value } : p)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={modalEditar.email} onChange={(e) => setModalEditar((p) => p ? { ...p, email: e.target.value } : p)} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={modalEditar.telefono ?? ""} onChange={(e) => setModalEditar((p) => p ? { ...p, telefono: e.target.value || null } : p)} />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Input value={modalEditar.rol} disabled className="bg-muted" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Dirección / Unidad</Label>
                <Input value={modalEditar.direccion ?? ""} onChange={(e) => setModalEditar((p) => p ? { ...p, direccion: e.target.value || null } : p)} placeholder="Torre A, Dpto 301" />
              </div>
              {modalEditar.rol === "RESIDENTE" && empresas.length > 0 && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Empresa <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Select
                    value={modalEditar.empresaId ?? SIN_EMPRESA}
                    onValueChange={(v) => setModalEditar((p) => p ? { ...p, empresaId: v === SIN_EMPRESA ? null : v } : p)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_EMPRESA}>Sin empresa</SelectItem>
                      {empresas.filter((e) => e.activo || e.id === modalEditar.empresaId).map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(null)}>Cancelar</Button>
            <Button onClick={editarUsuario} disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!modalEliminar} onOpenChange={(v) => { if (!v) setModalEliminar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {modalEliminar?.nombre}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Esta acción eliminará permanentemente la cuenta de{" "}
                  <strong className="text-foreground">{modalEliminar?.nombre}</strong> ({modalEliminar?.rol === "RESIDENTE" ? "Residente" : "Vigilante"}).
                </p>
                <p className="text-destructive font-medium">
                  Se borrarán también todas sus visitas, vehículos y registros de ingreso/salida históricos. Esta acción no se puede deshacer.
                </p>
                <p>Si el usuario solo se mudó temporalmente, considera desactivarlo en su lugar.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={eliminarUsuario}
              disabled={eliminando}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {eliminando ? "Eliminando…" : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Reset Password */}
      <Dialog open={!!modalReset} onOpenChange={(v) => { if (!v) setModalReset(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Resetear contraseña</DialogTitle></DialogHeader>
          {modalReset && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nueva contraseña para <strong>{modalReset.nombre}</strong>
              </p>
              <div className="space-y-1.5">
                <Label>Nueva contraseña</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalReset(null)}>Cancelar</Button>
            <Button onClick={resetPassword} disabled={guardando || newPassword.length < 8}>
              {guardando ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
