"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Bell, FileSpreadsheet, CheckCircle2, Loader2, CreditCard,
  ShieldCheck, Lock,
} from "lucide-react"

const SERVICIOS = {
  onboarding: {
    nombre: "Onboarding y Configuración",
    precio: 5900,
    precioStr: "S/ 59.00",
    icon: Bell,
    gradient: "from-amber-400 to-amber-600",
    descripcion: "Configuramos Gatekeeper en tu condominio: carga de residentes, creación de usuarios y puesta en marcha. Incluye 1 sesión de acompañamiento remoto.",
    incluye: [
      "Carga inicial de residentes",
      "Creación de usuarios y roles",
      "Configuración del sistema",
      "1 sesión de acompañamiento remoto",
    ],
  },
  capacitacion: {
    nombre: "Capacitación del Personal",
    precio: 2900,
    precioStr: "S/ 29.00",
    icon: FileSpreadsheet,
    gradient: "from-teal-500 to-teal-700",
    descripcion: "Capacitamos a tus vigilantes, residentes y administradores en el uso de la plataforma. Incluye sesión de preguntas en vivo.",
    incluye: [
      "Capacitación para vigilantes",
      "Capacitación para residentes",
      "Capacitación para administradores",
      "Sesión de preguntas en vivo",
    ],
  },
} as const

type TipoServicio = keyof typeof SERVICIOS

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any
    culqi: () => void
  }
}

interface Props {
  userEmail: string
  userName: string
}

export function ContrataServicioForm({ userEmail, userName }: Props) {
  const params = useSearchParams()
  const rawTipo = params.get("tipo") ?? ""
  const tipo: TipoServicio = rawTipo in SERVICIOS ? (rawTipo as TipoServicio) : "onboarding"
  const servicio = SERVICIOS[tipo]
  const Icon = servicio.icon

  const [loading, setLoading] = useState(false)
  const [culqiListo, setCulqiListo] = useState(false)
  const [exito, setExito] = useState(false)

  const resolveToken = useRef<((id: string) => void) | null>(null)
  const rejectToken = useRef<((msg?: string | null) => void) | null>(null)

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

  async function handlePagar() {
    setLoading(true)

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
          description: servicio.nombre,
          amount: servicio.precio,
        })
        window.Culqi.open()
      })
    } catch (err) {
      const msg = typeof err === "string" && err ? err : "Pago cancelado."
      toast.error(msg)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/servicios/contratar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, tipo }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al procesar el pago")
        setLoading(false)
        return
      }

      setExito(true)
    } catch {
      toast.error("Error de conexión")
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center py-20 space-y-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">¡Servicio contratado!</h2>
          <p className="text-muted-foreground text-sm">
            Hemos recibido tu pago por <strong>{servicio.nombre}</strong>.
            Nos pondremos en contacto contigo pronto para coordinar la sesión.
          </p>
        </div>
        <div className="w-full rounded-xl border bg-muted/30 p-5 text-sm text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Servicio</span>
            <span className="font-medium">{servicio.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto cobrado</span>
            <span className="font-medium">{servicio.precioStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{userEmail}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Te escribiremos a <strong>{userEmail}</strong> para coordinar los detalles.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start max-w-4xl mx-auto">

      {/* Panel principal */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Contratar servicio adicional</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hola <strong>{userName}</strong>, estás a punto de contratar un servicio de implementación.
          </p>
        </div>

        {/* Card del servicio */}
        <div className="rounded-xl border overflow-hidden">
          <div className={`bg-gradient-to-br ${servicio.gradient} p-5 flex items-center gap-4`}>
            <div className="bg-white/20 p-3 rounded-lg">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{servicio.nombre}</p>
              <div className="flex items-end gap-1 mt-0.5">
                <span className="text-white text-2xl font-bold">{servicio.precioStr}</span>
                <span className="text-white/70 text-xs mb-0.5">pago único</span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">{servicio.descripcion}</p>
            <ul className="space-y-2">
              {servicio.incluye.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Seguridad */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
          Pago cifrado con TLS. Certificación PCI DSS nivel 1. Aceptamos Visa, Mastercard y Amex.
        </div>

        {/* Botón de pago */}
        <Button
          onClick={handlePagar}
          size="lg"
          className="w-full text-base py-6"
          disabled={loading || !culqiListo}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Procesando…</>
          ) : !culqiListo ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Cargando pasarela…</>
          ) : (
            <><CreditCard className="h-5 w-5 mr-2" />Pagar {servicio.precioStr}</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Pago único procesado por Culqi — no genera suscripción
        </p>
      </div>

      {/* Resumen lateral */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border p-5 space-y-4 bg-muted/20 sticky top-6">
          <p className="font-semibold">Resumen del pedido</p>
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="font-medium">{servicio.nombre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pago único</p>
            </div>
            <span className="font-bold shrink-0 ml-3">{servicio.precioStr}</span>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {servicio.incluye.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="border-t pt-3 flex justify-between font-bold text-sm">
            <span>Total <span className="font-normal text-muted-foreground">(incl. IGV)</span></span>
            <span>{servicio.precioStr}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pago único. No se generan cobros recurrentes.
          </p>
        </div>
      </div>
    </div>
  )
}
