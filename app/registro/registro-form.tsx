"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Building2, User, Loader2, CheckCircle2,
  CreditCard, ArrowLeft, ShieldCheck, ChevronRight,
} from "lucide-react"

const PLANES = {
  BASICO: {
    nombre: "Básico",
    precio: 4900,
    precioStr: "S/ 49.00",
    descripcion: "Hasta 20 residentes · 1 vigilante · Historial 30 días",
  },
  ESTANDAR: {
    nombre: "Estándar",
    precio: 8900,
    precioStr: "S/ 89.00",
    descripcion: "Hasta 50 residentes · 3 vigilantes · Historial 90 días",
  },
  PREMIUM: {
    nombre: "Premium",
    precio: 14900,
    precioStr: "S/ 149.00",
    descripcion: "Residentes y vigilantes ilimitados · Soporte dedicado",
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

export function RegistroForm() {
  const router = useRouter()
  const params = useSearchParams()

  const rawPlan = (params.get("plan") ?? "ESTANDAR").toUpperCase()
  const planKey: PlanKey = rawPlan in PLANES ? (rawPlan as PlanKey) : "ESTANDAR"
  const plan = PLANES[planKey]

  const [step, setStep] = useState<1 | 2>(1)
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

  // Stores the resolve function of the pending token promise
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
    setStep(2)
  }

  async function handlePagar() {
    setLoading(true)

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
      toast.error("Pago cancelado.")
      setLoading(false)
      return
    }

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
        toast.error(err.error ?? "Error al procesar el pago")
        setLoading(false)
        return
      }

      setExitoso(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      toast.error("Error de conexión")
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (exitoso) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          <div>
            <p className="font-bold text-lg">¡Pago exitoso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu condominio está listo. Redirigiendo al inicio de sesión…
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step 2: Resumen y pago ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Progreso */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="text-foreground font-medium">1. Datos</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">2. Pago</span>
          </div>

          {/* Resumen del pedido */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="font-semibold text-sm">Resumen del pedido</p>
            <div className="flex justify-between items-start text-sm">
              <div>
                <p className="font-medium">Plan {plan.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.descripcion}</p>
              </div>
              <span className="font-semibold shrink-0 ml-4">{plan.precioStr}<span className="text-muted-foreground font-normal">/mes</span></span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>Total hoy <span className="font-normal text-muted-foreground">(incl. IGV)</span></span>
              <span>{plan.precioStr}</span>
            </div>
          </div>

          {/* Cuenta a crear */}
          <div className="rounded-lg border px-4 py-3 space-y-1 text-sm">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Cuenta a crear</p>
            <p><span className="text-muted-foreground">Condominio:</span> {form.nombreCondominio}</p>
            <p><span className="text-muted-foreground">Admin:</span> {form.adminNombre}</p>
            <p><span className="text-muted-foreground">Email:</span> {form.adminEmail}</p>
          </div>

          {/* Seguridad */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
            Pago seguro procesado por Culqi — Certificación PCI DSS nivel 1.
          </div>

          {/* Botón pagar */}
          <Button
            onClick={handlePagar}
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando…</>
            ) : (
              <><CreditCard className="h-4 w-4 mr-2" />Pagar {plan.precioStr}</>
            )}
          </Button>

          <button
            type="button"
            onClick={() => { setStep(1); setLoading(false) }}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver y editar datos
          </button>
        </CardContent>
      </Card>
    )
  }

  // ── Step 1: Datos ──────────────────────────────────────────────────────────
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Progreso */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <span className="text-primary font-semibold">1. Datos</span>
          <ChevronRight className="h-3 w-3" />
          <span>2. Pago</span>
        </div>

        {/* Plan seleccionado */}
        <div className="rounded-lg border bg-muted/30 px-4 py-3 mb-5 flex justify-between items-center text-sm">
          <div>
            <p className="font-medium">Plan {plan.nombre}</p>
            <p className="text-xs text-muted-foreground">{plan.descripcion}</p>
          </div>
          <span className="font-bold text-base">{plan.precioStr}<span className="text-xs font-normal text-muted-foreground">/mes</span></span>
        </div>

        <form onSubmit={handleContinuar} className="space-y-5">
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

          <Button type="submit" className="w-full">
            Continuar al pago
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
