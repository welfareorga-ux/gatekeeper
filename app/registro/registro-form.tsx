"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, User, Loader2, CheckCircle2 } from "lucide-react"

export function RegistroForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombreCondominio: "",
    direccion: "",
    adminNombre: "",
    adminEmail: "",
    adminPassword: "",
    confirmarPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  function campo(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.adminPassword !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (form.adminPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCondominio: form.nombreCondominio,
          direccion: form.direccion,
          adminNombre: form.adminNombre,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al registrar")
        return
      }

      setExitoso(true)
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (exitoso) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          <div>
            <p className="font-bold text-lg">¡Registro exitoso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu condominio está listo. Redirigiendo al inicio de sesión…
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos del condominio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Datos del condominio
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del condominio *</Label>
              <Input {...campo("nombreCondominio")} placeholder="Residencial Los Pinos" required />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección *</Label>
              <Input {...campo("direccion")} placeholder="Av. Principal 450, San Borja, Lima" required />
            </div>
          </div>

          <Separator />

          {/* Datos del administrador */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" />
              Cuenta del administrador
            </div>
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input {...campo("adminNombre")} placeholder="Juan Pérez García" required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" {...campo("adminEmail")} placeholder="admin@micondominio.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contraseña *</Label>
                <Input type="password" {...campo("adminPassword")} placeholder="Mín. 8 caracteres" required />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar *</Label>
                <Input type="password" {...campo("confirmarPassword")} placeholder="Repite la contraseña" required />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando…
              </>
            ) : (
              "Crear mi condominio"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
