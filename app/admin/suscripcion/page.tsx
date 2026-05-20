"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CreditCard, CheckCircle2, XCircle, Loader2 } from "lucide-react"

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
}

export default function SuscripcionPage() {
  const [data, setData] = useState<SuscripcionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    fetch("/api/admin/suscripcion")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={cancelando}>
                  {cancelando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cancelar suscripción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu plan {planInfo.label} será cancelado. Mantendrás acceso hasta el final del período actual.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelar}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sí, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {!activa && (
        <p className="text-sm text-muted-foreground text-center">
          Tu suscripción está cancelada. Contacta a soporte para reactivarla.
        </p>
      )}
    </div>
  )
}
