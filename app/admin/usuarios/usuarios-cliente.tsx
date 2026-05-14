"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, KeyRound, Pencil, Search } from "lucide-react"
import { formatFecha } from "@/lib/utils"

type Usuario = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: "RESIDENTE" | "VIGILANTE" | "ADMIN"
  direccion: string | null
  activo: boolean
  createdAt: string
}

interface Props {
  usuariosIniciales: Usuario[]
}

const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  VIGILANTE: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  RESIDENTE: "bg-green-500/10 text-green-400 border border-green-500/20",
}

const FORM_INICIAL = { nombre: "", email: "", password: "", rol: "RESIDENTE", telefono: "", direccion: "" }

export function UsuariosCliente({ usuariosIniciales }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales)
  const [filtroRol, setFiltroRol] = useState("TODOS")
  const [buscar, setBuscar] = useState("")

  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null)
  const [modalReset, setModalReset] = useState<Usuario | null>(null)

  const [form, setForm] = useState(FORM_INICIAL)
  const [newPassword, setNewPassword] = useState("")
  const [guardando, setGuardando] = useState(false)

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

  async function crearUsuario() {
    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      toast.error("Nombre, email y contraseña son requeridos")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Error al actualizar"); return }
      const actualizado = await res.json()
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? { ...u, ...actualizado } : u)))
      toast.success("Usuario actualizado")
      setModalEditar(null)
    } catch { toast.error("Error de conexión") }
    finally { setGuardando(false) }
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

      <p className="text-sm text-muted-foreground">
        {filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}
      </p>

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
                  <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                    {u.direccion ?? "—"}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(null)}>Cancelar</Button>
            <Button onClick={editarUsuario} disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
