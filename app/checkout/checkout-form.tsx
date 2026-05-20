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

type Step = "datos" | "pago" | "exito"

export function CheckoutForm() {
  const router = useRouter()
  const params = useSearchParams()
  const rawPlan = (params.get("plan") ?? "ESTANDAR").toUpperCase()
  const planKey: PlanKey = rawPlan in PLANES ? (rawPlan as PlanKey) : "ESTANDAR"
  const plan = PLANES[planKey]

  const [step, setStep] = useState<Step>("datos")
  const [loadingPago, setLoadingPago] = useState(false)
  const [loadingCuenta, setLoadingCuenta] = useState(false)
  const [culqiListo, setCulqiListo] = useState(false)

  const [form, setForm] = useState({
    nombreCondominio: "",
    direccion: "",
    adminNombre: "",
    adminEmail: "",
    adminPassword: "",
    confirmarPassword: "",
  })

  const resolveToken = useRef<((id: string) => void) | null>(null)
  const rejectToken = useRef<((msg?: string | null) => void) | null>(null)

  // Carga el script de Culqi manualmente para detectar errores
  useEffect(() => {
    if (window.Culqi) { setCulqiListo(true); return }
    const script = document.createElement("script")
    script.src = "https://checkout.culqi.com/v4/culqi.js"
    script.async = true
    script.onload = () => {
      console.log("[Culqi] script cargado ✅, window.Culqi:", typeof window.Culqi)
      setCulqiListo(true)
    }
    script.onerror = (e) => {
      console.error("[Culqi] script NO cargó ❌", e)
      toast.error("Error al cargar la pasarela de pago. Revisa tu conexión.")
    }
    document.head.appendChild(script)
    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    window.culqi = function () {
      console.log("[Culqi] callback fired", {
        token: window.Culqi?.token,
        error: window.Culqi?.error,
      })
      if (window.Culqi?.token) {
        resolveToken.current?.(window.Culqi.token.id)
      } else {
        const errMsg = window.Culqi?.error?.user_message ?? null
        rejectToken.current?.(errMsg)
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

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault()
    if (form.adminPassword !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (form.adminPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }
    setStep("pago")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handlePagar() {
    setLoadingPago(true)

    let tokenId: string
    try {
      tokenId = await new Promise<string>((resolve, reject) => {
        resolveToken.current = resolve
        rejectToken.current = (msg?: string | null) => reject(msg ?? null)

        const pk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY
        console.log("[Culqi] pk disponible:", !!pk, "| window.Culqi:", typeof window.Culqi)

        if (!pk) {
          reject("Clave pública no configurada — contacta al soporte")
          return
        }
        if (!window.Culqi) {
          reject("Pasarela de pago no disponible. Recarga la página e intenta de nuevo.")
          return
        }

        window.Culqi.publicKey = pk
        window.Culqi.settings({
          title: "Gatekeeper",
          currency: "PEN",
          description: `Plan ${plan.nombre} — 1 mes`,
          amount: plan.precio,
        })
        console.log("[Culqi] Culqi.open() llamado")
        window.Culqi.open()
      })
    } catch (err) {
      const msg = typeof err === "string" && err
        ? err
        : "Pago cancelado."
      toast.error(msg)
      setLoadingPago(false)
      return
    }

    // Pago aprobado — crear cuenta
    setLoadingCuenta(true)
    try {
      const res = await fetch("/api/pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
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
        setLoadingPago(false)
        setLoadingCuenta(false)
        return
      }

      setStep("exito")
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      toast.error("Error de conexión")
      setLoadingPago(false)
      setLoadingCuenta(false)
    }
  }

  // ── Éxito ────────────────────────────────────────────────────────────────
  if (step === "exito") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center py-20 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">¡Pago exitoso!</h2>
        <p className="text-muted-foreground">
          Tu condominio ha sido registrado.<br />
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

      {/* ── Panel principal ──────────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-6">

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1.5 font-medium ${step === "datos" ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === "datos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step === "pago" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : "1"}
            </span>
            Tus datos
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 font-medium ${step === "pago" ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === "pago" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </span>
            Pago
          </div>
        </div>

        {/* ── PASO 1: Datos ──────────────────────────────────────────────── */}
        {step === "datos" && (
          <form onSubmit={handleContinuar} className="space-y-5">
            <div>
              <h1 className="text-xl font-bold">Información de la cuenta</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Completa tus datos y en el siguiente paso realizarás el pago.
              </p>
            </div>

            {/* Plan */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Plan {plan.nombre}</p>
                <p className="text-xs text-muted-foreground">{plan.descripcion}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold">{plan.precioStr}</p>
                <p className="text-xs text-muted-foreground">/mes</p>
              </div>
            </div>

            {/* Condominio */}
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

            {/* Administrador */}
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

            <Button type="submit" size="lg" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Continuar al pago
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              El siguiente paso es el pago seguro con Culqi
            </p>
          </form>
        )}

        {/* ── PASO 2: Pago ───────────────────────────────────────────────── */}
        {step === "pago" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Pago seguro</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Revisa tu pedido y haz clic en "Pagar" para abrir la pasarela de Culqi.
              </p>
            </div>

            {/* Resumen de datos */}
            <div className="rounded-lg border px-4 py-3 space-y-1 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Cuenta a crear</p>
              <p><span className="text-muted-foreground">Condominio:</span> {form.nombreCondominio}</p>
              <p><span className="text-muted-foreground">Administrador:</span> {form.adminNombre}</p>
              <p><span className="text-muted-foreground">Email:</span> {form.adminEmail}</p>
            </div>

            {/* Sello seguridad */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
              Pago cifrado con TLS. Certificación PCI DSS nivel 1. Aceptamos Visa, Mastercard y Amex.
            </div>

            {/* Botón principal de pago */}
            <Button
              onClick={handlePagar}
              size="lg"
              className="w-full text-base py-6"
              disabled={loadingPago || loadingCuenta || !culqiListo}
            >
              {(loadingPago || loadingCuenta) ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Procesando…</>
              ) : !culqiListo ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Cargando pasarela…</>
              ) : (
                <><CreditCard className="h-5 w-5 mr-2" />Pagar {plan.precioStr}</>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep("datos")}
              disabled={loadingPago || loadingCuenta}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto disabled:opacity-50"
            >
              ← Volver y editar datos
            </button>
          </div>
        )}
      </div>

      {/* ── Resumen lateral ──────────────────────────────────────────────── */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border p-5 space-y-4 bg-muted/20 sticky top-6">
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
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
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
            Incluye 14 días de prueba gratuita. Cancela cuando quieras desde tu panel.
          </p>
        </div>
      </div>
    </div>
  )
}
