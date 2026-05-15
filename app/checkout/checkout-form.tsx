"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard, CheckCircle2, Loader2, ShieldCheck,
  Building2, User, ChevronRight, Lock,
} from "lucide-react"

const PLANES = {
  BASICO: {
    nombre: "Básico",
    precio: 4900,
    precioStr: "S/ 49.00",
    descripcion: "Hasta 20 residentes · 1 vigilante · Historial 30 días",
    features: ["Hasta 20 residentes", "1 vigilante", "Historial 30 días", "Soporte por email"],
  },
  ESTANDAR: {
    nombre: "Estándar",
    precio: 8900,
    precioStr: "S/ 89.00",
    descripcion: "Hasta 50 residentes · 3 vigilantes · Historial 90 días",
    features: ["Hasta 50 residentes", "3 vigilantes", "Historial 90 días", "Reportes y exportación", "Soporte prioritario"],
  },
  PREMIUM: {
    nombre: "Premium",
    precio: 14900,
    precioStr: "S/ 149.00",
    descripcion: "Sin límites · Soporte dedicado · Historial ilimitado",
    features: ["Residentes ilimitados", "Vigilantes ilimitados", "Historial ilimitado", "Reportes avanzados", "Soporte dedicado"],
  },
} as const

type PlanKey = keyof typeof PLANES

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any
    culqi: () => void
  }
}

type Step = "pago" | "datos" | "exito"

export function CheckoutForm() {
  const router = useRouter()
  const params = useSearchParams()
  const rawPlan = (params.get("plan") ?? "ESTANDAR").toUpperCase()
  const planKey: PlanKey = rawPlan in PLANES ? (rawPlan as PlanKey) : "ESTANDAR"
  const plan = PLANES[planKey]

  const [step, setStep] = useState<Step>("pago")
  const [culqiToken, setCulqiToken] = useState("")
  const [loadingPago, setLoadingPago] = useState(false)
  const [loadingCuenta, setLoadingCuenta] = useState(false)

  const [form, setForm] = useState({
    nombreCondominio: "",
    direccion: "",
    adminNombre: "",
    adminEmail: "",
    adminPassword: "",
    confirmarPassword: "",
  })

  const resolveToken = useRef<((id: string) => void) | null>(null)
  const rejectToken = useRef<(() => void) | null>(null)

  useEffect(() => {
    window.culqi = function () {
      if (window.Culqi?.token) {
        resolveToken.current?.(window.Culqi.token.id)
      } else {
        rejectToken.current?.()
      }
      resolveToken.current = null
      rejectToken.current = null
    }
  }, [])

  function campo(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    }
  }

  async function handlePagar() {
    setLoadingPago(true)

    let tokenId: string
    try {
      tokenId = await new Promise<string>((resolve, reject) => {
        resolveToken.current = resolve
        rejectToken.current = reject

        const pk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY
        if (!pk || !window.Culqi) {
          reject()
          return
        }

        window.Culqi.publicKey = pk
        window.Culqi.settings({
          title: "Gatekeeper",
          currency: "PEN",
          description: `Plan ${plan.nombre} — 1 mes`,
          amount: plan.precio,
        })
        window.Culqi.open()
      })
    } catch {
      toast.error("Pago cancelado o con error.")
      setLoadingPago(false)
      return
    }

    // Pago aprobado — pasamos a completar la cuenta
    setCulqiToken(tokenId)
    setLoadingPago(false)
    setStep("datos")
  }

  async function handleCrearCuenta(e: React.FormEvent) {
    e.preventDefault()
    if (form.adminPassword !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (form.adminPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    setLoadingCuenta(true)
    try {
      const res = await fetch("/api/pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: culqiToken,
          plan: planKey,
          amount: plan.precio,
          nombreCondominio: form.nombreCondominio,
          direccion: form.direccion,
          adminNombre: form.adminNombre,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al crear la cuenta")
        return
      }

      setStep("exito")
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoadingCuenta(false)
    }
  }

  // ── Éxito ────────────────────────────────────────────────────────────────
  if (step === "exito") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center py-20 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">¡Listo!</h2>
        <p className="text-muted-foreground">
          Tu pago fue procesado y la cuenta ha sido creada.<br />
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    )
  }

  // ── Paso 2: Datos de la cuenta ────────────────────────────────────────────
  if (step === "datos") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Formulario */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-600">Pago aprobado</span>
            </div>
            <h1 className="text-2xl font-bold">Completa tu cuenta</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Crea las credenciales de acceso para tu condominio.
            </p>
          </div>

          <form onSubmit={handleCrearCuenta} className="space-y-5">
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
                  <Input type="password" {...campo("confirmarPassword")} placeholder="Repite" required />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loadingCuenta}>
              {loadingCuenta
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando cuenta…</>
                : "Crear mi cuenta →"}
            </Button>
          </form>
        </div>

        {/* Resumen lateral */}
        <div className="lg:col-span-2">
          <OrderSummary plan={plan} planKey={planKey} />
        </div>
      </div>
    )
  }

  // ── Paso 1: Pago ─────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* Panel de pago */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Finalizar compra</h1>
          <p className="text-muted-foreground text-sm mt-1">
            14 días de prueba incluidos. Cancela cuando quieras.
          </p>
        </div>

        {/* Selección de plan */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">Plan seleccionado</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(PLANES) as PlanKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => router.push(`/checkout?plan=${k}`)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  k === planKey
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "hover:border-muted-foreground/40"
                }`}
              >
                <p className="font-semibold text-sm">{PLANES[k].nombre}</p>
                <p className="text-lg font-bold mt-0.5">{PLANES[k].precioStr}</p>
                <p className="text-xs text-muted-foreground">/mes</p>
              </button>
            ))}
          </div>
        </div>

        {/* Botón de pago */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handlePagar}
            size="lg"
            className="w-full text-base py-6"
            disabled={loadingPago}
          >
            {loadingPago ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Abriendo pasarela…</>
            ) : (
              <><CreditCard className="h-5 w-5 mr-2" />Pagar {plan.precioStr} con Culqi</>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Pago cifrado con TLS. Certificación PCI DSS nivel 1.
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            Aceptamos Visa, Mastercard y American Express emitidas en Perú.
          </div>
        </div>
      </div>

      {/* Resumen lateral */}
      <div className="lg:col-span-2">
        <OrderSummary plan={plan} planKey={planKey} />
      </div>
    </div>
  )
}

function OrderSummary({
  plan,
  planKey,
}: {
  plan: (typeof PLANES)[PlanKey]
  planKey: PlanKey
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4 bg-muted/20">
      <p className="font-semibold">Resumen del pedido</p>

      <div className="flex justify-between items-start text-sm">
        <div>
          <p className="font-medium">Plan {plan.nombre}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.descripcion}</p>
        </div>
        <span className="font-bold shrink-0 ml-3">{plan.precioStr}</span>
      </div>

      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Separator />

      <div className="flex justify-between font-bold text-sm">
        <span>Total hoy <span className="font-normal text-muted-foreground">(incl. IGV)</span></span>
        <span>{plan.precioStr}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Se renovará automáticamente cada mes. Cancela desde tu panel en cualquier momento.
      </p>
    </div>
  )
}
