"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  CreditCard, CheckCircle2, XCircle, Loader2,
  AlertTriangle, RefreshCw, Calendar, Clock, Shield, BarChart3, Building2,
  Bell, FileSpreadsheet,
} from "lucide-react"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any
    culqi: () => void
  }
}

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

const PLANES_DISPONIBLES = [
  {
    key: "BASICO" as const,
    nombre: "Básico",
    precio: 4900,
    precioStr: "S/ 49",
    descripcion: "Ideal para condominios pequeños",
    icon: Shield,
    gradient: "from-blue-500 to-blue-700",
    features: ["Hasta 20 residentes", "1 vigilante", "Historial 30 días", "Soporte por email"],
  },
  {
    key: "ESTANDAR" as const,
    nombre: "Estándar",
    precio: 8900,
    precioStr: "S/ 89",
    descripcion: "El más elegido. Para condominios medianos",
    icon: BarChart3,
    gradient: "from-primary to-primary/70",
    features: ["Hasta 50 residentes", "3 vigilantes", "Historial 90 días", "Reportes y exportación"],
    destacado: true,
  },
  {
    key: "PREMIUM" as const,
    nombre: "Premium",
    precio: 14900,
    precioStr: "S/ 149",
    descripcion: "Sin límites para grandes edificios",
    icon: Building2,
    gradient: "from-purple-500 to-purple-800",
    features: ["Residentes ilimitados", "Vigilantes ilimitados", "Historial ilimitado", "Soporte dedicado"],
  },
]

type SuscripcionData = {
  plan: string
  suscripcionEstado: string
  culqiSubscriptionId: string | null
  nombre: string
  trialEndsAt: string | null
  currentPeriodEnd: number | null
}

export default function SuscripcionPage() {
  const { update: updateSession } = useSession()
  const [data, setData] = useState<SuscripcionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [suscribiendo, setSuscribiendo] = useState<string | null>(null)
  const [culqiListo, setCulqiListo] = useState(false)

  const resolveToken = useRef<((id: string) => void) | null>(null)
  const rejectToken = useRef<((msg?: string | null) => void) | null>(null)

  const fetchData = () => {
    setLoading(true)
    fetch("/api/admin/suscripcion")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    updateSession()
  }, [])

  // Carga Culqi
  useEffect(() => {
    if (window.Culqi) { setCulqiListo(true); return }
    const script = document.createElement("script")
    script.src = "https://checkout.culqi.com/js/v4"
    script.async = true
    script.onload = () => setCulqiListo(true)
    script.onerror = () => toast.error("Error al cargar la pasarela de pago. Recarga la página.")
    document.head.appendChild(script)
    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    window.culqi = function () {
      if (window.Culqi?.token) {
        resolveToken.current?.(window.Culqi.token.id)
        resolveToken.current = null
        rejectToken.current = null
      } else if (window.Culqi?.error) {
        toast.error(window.Culqi.error.user_message ?? "Error al procesar la tarjeta.")
      } else {
        rejectToken.current?.(null)
        resolveToken.current = null
        rejectToken.current = null
      }
    }
  }, [])

  async function handleSuscribir(planKey: "BASICO" | "ESTANDAR" | "PREMIUM", precio: number, planNombre: string) {
    setSuscribiendo(planKey)

    let tokenId: string
    try {
      tokenId = await new Promise<string>((resolve, reject) => {
        resolveToken.current = resolve
        rejectToken.current = (msg?: string | null) => reject(msg ?? null)

        const pk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY
        if (!pk || !window.Culqi) {
          reject("Pasarela de pago no disponible. Recarga la página.")
          return
        }

        window.Culqi.publicKey = pk
        window.Culqi.settings({
          title: "Gatekeeper",
          currency: "PEN",
          description: `Plan ${planNombre} — 1 mes`,
          amount: precio,
        })
        window.Culqi.open()
      })
    } catch (err) {
      const msg = typeof err === "string" && err ? err : "Pago cancelado."
      toast.error(msg)
      setSuscribiendo(null)
      return
    }

    try {
      const res = await fetch("/api/admin/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, plan: planKey }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al procesar el pago")
        setSuscribiendo(null)
        return
      }

      toast.success(`¡Plan ${planNombre} activado correctamente!`)
      await updateSession()
      fetchData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSuscribiendo(null)
    }
  }

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
  const esTrial = data.suscripcionEstado === "trial"

  const daysLeftTrial = data.trialEndsAt
    ? Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const fechaVencimiento = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd * 1000).toLocaleDateString("es-PE", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

  const mostrarSelectorPlanes = !activa

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mi suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu plan y facturación.</p>
      </div>

      {/* Estado actual */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {esTrial ? <Clock className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              {esTrial ? "Prueba gratuita" : `Plan ${planInfo.label}`}
            </CardTitle>
            <Badge variant={activa ? "default" : esTrial ? "secondary" : "destructive"}>
              {activa ? "Activa" : esTrial ? "Trial" : "Inactiva"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {esTrial ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Tienes acceso completo a todas las funciones durante tu período de prueba gratuita.
              </p>
              {daysLeftTrial !== null && daysLeftTrial > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {daysLeftTrial === 1 ? "¡Último día de prueba!" : `${daysLeftTrial} días restantes`}
                    {" "}Elige un plan abajo para continuar.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Selector de planes (trial o inactivo) ─────────────────────────────── */}
      {mostrarSelectorPlanes && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {esTrial ? "Activa tu suscripción" : "Elige un plan"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {esTrial
                ? "Sin interrupciones. Tu historial y usuarios se conservan al activar."
                : "Reactiva el acceso eligiendo el plan que mejor se adapte a tu condominio."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANES_DISPONIBLES.map((plan) => {
              const Icon = plan.icon
              const isLoading = suscribiendo === plan.key
              return (
                <div
                  key={plan.key}
                  className={`rounded-xl border overflow-hidden ${plan.destacado ? "border-primary shadow-md shadow-primary/10" : ""}`}
                >
                  <div className={`bg-gradient-to-br ${plan.gradient} p-5 flex flex-col items-center gap-2`}>
                    {plan.destacado && (
                      <span className="text-xs font-semibold text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full">
                        Más popular
                      </span>
                    )}
                    <Icon className="h-8 w-8 text-white/90" />
                    <p className="text-white font-bold text-lg">{plan.nombre}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-white text-2xl font-bold">{plan.precioStr}</span>
                      <span className="text-white/70 text-xs mb-0.5">/mes</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-muted-foreground text-xs leading-relaxed">{plan.descripcion}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.destacado ? "default" : "outline"}
                      className="w-full"
                      size="sm"
                      disabled={!!suscribiendo || !culqiListo}
                      onClick={() => handleSuscribir(plan.key, plan.precio, plan.nombre)}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Procesando…</>
                      ) : !culqiListo ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Cargando…</>
                      ) : (
                        `Suscribirme — ${plan.precioStr}/mes`
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Pago seguro procesado por Culqi — PCI DSS nivel 1. Cancela cuando quieras.
          </p>
        </div>
      )}

      {/* ── Cancelar (solo si activa) ─────────────────────────────────────────── */}
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
              <Button variant="destructive" size="sm" onClick={() => setConfirmando(true)}>
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

      {/* ── Servicios adicionales ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Servicios adicionales</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complementa tu plan con implementación y capacitación profesional.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Bell,
              gradient: "from-amber-400 to-amber-600",
              slug: "onboarding",
              nombre: "Onboarding y Configuración",
              precio: "S/ 99",
              descripcion: "Carga de residentes, creación de usuarios y puesta en marcha. Incluye 1 sesión de acompañamiento remoto.",
            },
            {
              icon: FileSpreadsheet,
              gradient: "from-teal-500 to-teal-700",
              slug: "capacitacion",
              nombre: "Capacitación del Personal",
              precio: "S/ 79",
              descripcion: "Capacitación para vigilantes, residentes y administradores. Incluye sesión de preguntas en vivo.",
            },
          ].map((srv) => {
            const Icon = srv.icon
            return (
              <div key={srv.slug} className="rounded-xl border overflow-hidden">
                <div className={`bg-gradient-to-br ${srv.gradient} p-4 flex items-center gap-3`}>
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{srv.nombre}</p>
                    <p className="text-white text-lg font-bold mt-0.5">{srv.precio} <span className="text-white/70 text-xs font-normal">pago único</span></p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-muted-foreground text-xs leading-relaxed">{srv.descripcion}</p>
                  <Link href={`/contratar-servicio?tipo=${srv.slug}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">Contratar servicio</Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Renovar (cancelada pero sin selector de planes) ───────────────────── */}
      {!activa && !mostrarSelectorPlanes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Renovar suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Selecciona un plan arriba para reactivar tu acceso.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
