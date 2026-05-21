"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw, Calendar } from "lucide-react"

const PLAN_INFO: Record<string, { label: string; precio: string; features: string[] }> = {
  BASICO: {
    label: "Básico",
    precio: "S/ 49.00 / mes",
    features: ["Hasta 20 residentes", "1 vigilante", "Historial 30 días", "Soporte por email"],
  },
  ESTANDAR: {
    label: "Estándar",
    precio: "S/ 89.00 / mes",
    features: ["Hasta 50 residentes", "3 vigilantes", "Historial 90 días", "Reportes y exportación"],
  },
  PREMIUM: {
    label: "Premium",
    precio: "S/ 149.00 / mes",
    features: ["Residentes ilimitados", "Vigilantes ilimitados", "Historial ilimitado", "Soporte dedicado"],
  },
}

type SuscripcionData = {
  plan: string
  suscripcionEstado: string
  culqiSubscriptionId: string | null
  nombre: string
  currentPeriodEnd: number | null
}

export default function SuscripcionPage() {
  const { update: updateSession } = useSession()
  const [data, setData] = useState<SuscripcionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    fetch("/api/admin/suscripcion")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
    // Sincroniza el JWT con el estado actual de la DB
    updateSession()
  }, [])

  async function handleCancelar() {
    setCancelando(true)
    try {
      const res = await fetch("/api/admin/suscripcion", { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al cancelar")
        return
      }
      toast.success("Suscripción cancelada. Mantendrás acceso hasta fin del período.")
      setData((prev) => prev ? { ...prev, suscripcionEstado: "cancelada" } : prev)
      await updateSession()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCancelando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const planInfo = PLAN_INFO[data.plan] ?? { label: data.plan, precio: "—", features: [] }
  const activa = data.suscripcionEstado === "activa"

  const fechaVencimiento = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd * 1000).toLocaleDateString("es-PE", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu plan y facturación.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan {planInfo.label}
            </CardTitle>
            <Badge variant={activa ? "default" : "secondary"}>
              {activa ? "Activa" : "Cancelada"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">{planInfo.precio}</p>

          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {planInfo.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {fechaVencimiento && !activa && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Acceso disponible hasta el <strong>{fechaVencimiento}</strong></span>
            </div>
          )}

          {data.culqiSubscriptionId && (
            <p className="text-xs text-muted-foreground">
              ID de suscripción: <span className="font-mono">{data.culqiSubscriptionId}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {activa && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Cancelar suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Al cancelar, mantendrás acceso hasta el final del período pagado. No se realizarán más cobros.
            </p>

            {!confirmando ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmando(true)}
              >
                Cancelar suscripción
              </Button>
            ) : (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">¿Confirmas la cancelación?</p>
                    <p className="text-muted-foreground mt-0.5">
                      Tu plan <strong>{planInfo.label}</strong> será cancelado. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelando}
                    onClick={handleCancelar}
                  >
                    {cancelando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sí, cancelar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelando}
                    onClick={() => setConfirmando(false)}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!activa && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Renovar suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reactiva tu suscripción para recuperar el acceso completo al panel de administración.
            </p>
            <Button asChild>
              <a href={`/checkout?plan=${data.plan}`}>
                Renovar plan {planInfo.label}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
