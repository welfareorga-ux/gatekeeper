"use client"

import { signOut } from "next-auth/react"
import { Shield, AlertTriangle, Mail, LogOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  adminNombre: string
  adminEmail: string
  condominioNombre: string
  planLabel: string
  estado: string
}

const ESTADO_INFO: Record<string, { titulo: string; descripcion: string; badge: string }> = {
  cancelada: {
    titulo: "Suscripción cancelada",
    descripcion: "Tu suscripción ha sido cancelada. El acceso al panel ha sido suspendido.",
    badge: "Cancelada",
  },
  vencida: {
    titulo: "Pago no procesado",
    descripcion: "No pudimos procesar tu último pago. Por favor actualiza tu método de pago para reactivar el acceso.",
    badge: "Vencida",
  },
}

export function SuscripcionInactivaClient({ adminNombre, adminEmail, condominioNombre, planLabel, estado }: Props) {
  const info = ESTADO_INFO[estado] ?? {
    titulo: "Suscripción inactiva",
    descripcion: "Tu suscripción no está activa. Contacta a soporte para reactivarla.",
    badge: "Inactiva",
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Gatekeeper</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 text-center">

          {/* Ícono de alerta */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          {/* Título y descripción */}
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-2">{info.badge}</Badge>
            <h1 className="text-2xl font-bold">{info.titulo}</h1>
            <p className="text-muted-foreground text-sm">{info.descripcion}</p>
          </div>

          {/* Datos del condominio */}
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Condominio</span>
              <span className="font-medium">{condominioNombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{planLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Administrador</span>
              <span className="font-medium">{adminNombre}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <a href={`mailto:soporte@gatekeeper.pe?subject=Reactivar suscripción — ${condominioNombre}&body=Hola, soy ${adminNombre} (${adminEmail}). Necesito reactivar mi suscripción al plan ${planLabel}.`}>
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contactar soporte
              </Button>
            </a>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar estado
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ¿Tienes dudas? Escríbenos a{" "}
            <a href="mailto:soporte@gatekeeper.pe" className="underline">soporte@gatekeeper.pe</a>
          </p>
        </div>
      </div>
    </div>
  )
}
