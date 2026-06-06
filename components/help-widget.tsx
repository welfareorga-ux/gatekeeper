"use client"

import { useState } from "react"
import {
  MessageCircleQuestion,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCheck,
  Home,
  CreditCard,
  LifeBuoy,
  Mail,
  Phone,
  MessageCircle,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Centro de ayuda flotante — FAQ guiado (árbol de decisiones, sin IA).
 * Botón pequeño abajo a la derecha; solo se abre al pulsarlo, no obstruye la pantalla.
 * El contenido se basa en el manual (/manual). Si más adelante se quiere un bot con IA,
 * basta con reemplazar el cuerpo del panel manteniendo el mismo botón flotante.
 */

type Faq = { q: string; a: string[] }
type Category = {
  id: string
  label: string
  icon: React.ElementType
  accent: string
  items: Faq[]
}

const CATEGORIES: Category[] = [
  {
    id: "admin",
    label: "Administrador",
    icon: Building2,
    accent: "bg-primary text-primary-foreground",
    items: [
      {
        q: "¿Cómo agrego residentes o vigilantes?",
        a: [
          "Entra al panel y abre Usuarios en el menú lateral.",
          "Haz clic en Nuevo usuario.",
          "Escribe nombre y email, y asigna el rol RESIDENTE o VIGILANTE.",
          "Copia las credenciales y compártelas con la persona.",
        ],
      },
      {
        q: "¿Cómo veo reportes y los exporto?",
        a: [
          "Abre Reportes para ver visitas por día, por residente y vehículos frecuentes.",
          "Pulsa el botón para exportar los datos a Excel o PDF.",
        ],
      },
      {
        q: "¿Qué es la Auditoría?",
        a: [
          "En Auditoría ves el historial completo de acciones de cada usuario: ingresos registrados, cambios de configuración y más.",
        ],
      },
      {
        q: "¿Cómo marco un vehículo o persona en alerta?",
        a: [
          "Abre Alertas y registra el vehículo o la persona a vigilar.",
          "Cuando el vigilante intente registrar ese vehículo, verá una advertencia.",
        ],
      },
      {
        q: "¿Cómo cambio o cancelo mi plan?",
        a: [
          "Abre Suscripción y Servicios en el menú.",
          "Desde ahí cambias de plan, cancelas o contratas servicios de implementación y capacitación.",
        ],
      },
    ],
  },
  {
    id: "vigilante",
    label: "Vigilante",
    icon: UserCheck,
    accent: "bg-green-600 text-white",
    items: [
      {
        q: "¿Cómo inicio mi turno?",
        a: [
          "Inicia sesión en gatekeeper-app.org con tus credenciales.",
          "Pulsa Iniciar turno. Sin turno activo no podrás registrar ingresos.",
        ],
      },
      {
        q: "¿Cómo registro el ingreso de un visitante?",
        a: [
          "Escribe la placa o el DNI en el buscador (funciona bien en celular).",
          "Confirma los datos del visitante y del residente al que visita.",
          "Pulsa Registrar ingreso. El residente recibirá un email automático.",
        ],
      },
      {
        q: "¿Puedo escanear el código QR con la cámara?",
        a: [
          "Sí. En el buscador elige el modo QR y acepta el permiso de cámara.",
          "Apunta al QR que el residente le envió al visitante; la visita se ubica sola.",
          "Si la cámara falla, puedes teclear el código manualmente.",
        ],
      },
      {
        q: "¿Cómo registro la salida?",
        a: [
          "Abre la sección Dentro para ver los vehículos que están en el condominio.",
          "Busca el vehículo y pulsa Registrar salida. El residente recibirá otra notificación.",
        ],
      },
      {
        q: "¿Cómo finalizo mi turno?",
        a: [
          "Al terminar tu jornada, pulsa Finalizar turno. Esto cierra el período de registro.",
        ],
      },
    ],
  },
  {
    id: "residente",
    label: "Residente",
    icon: Home,
    accent: "bg-blue-600 text-white",
    items: [
      {
        q: "¿Cómo registro una visita?",
        a: [
          "Abre Nueva Visita en el menú.",
          "Escribe el nombre del visitante, la placa del vehículo y la fecha y hora esperada.",
          "Se genera un código QR que puedes compartir por WhatsApp o email con tu visitante.",
        ],
      },
      {
        q: "¿Qué son las plantillas de visitas frecuentes?",
        a: [
          "En Plantillas guardas los datos de visitantes recurrentes (familia, delivery habitual, etc.).",
          "Las usas para crear nuevas visitas en segundos sin volver a escribir los datos.",
        ],
      },
      {
        q: "¿Dónde veo mi historial de visitas?",
        a: [
          "En Historial ves todas tus visitas pasadas, con las horas de ingreso y salida registradas por el vigilante.",
        ],
      },
      {
        q: "¿Me avisan cuando llega mi visita?",
        a: [
          "Sí. Recibes un email cuando tu visitante ingresa al condominio.",
          "También recibes un email cuando sale, incluyendo el tiempo de permanencia.",
        ],
      },
    ],
  },
  {
    id: "cuenta",
    label: "Suscripción y pagos",
    icon: CreditCard,
    accent: "bg-amber-500 text-white",
    items: [
      {
        q: "¿Tengo periodo de prueba gratis?",
        a: [
          "Sí: al registrarte tienes 14 días gratis con todas las funciones.",
          "Puedes empezar sin ingresar tarjeta y suscribirte cuando quieras.",
        ],
      },
      {
        q: "¿Qué métodos de pago aceptan?",
        a: [
          "El pago es con tarjeta mediante Culqi (procesador peruano), de forma segura.",
          "La suscripción se cobra de forma automática cada mes.",
        ],
      },
      {
        q: "¿Qué pasa si falla el cobro mensual?",
        a: [
          "Te enviamos un email avisando del cobro fallido.",
          "Actualiza tu tarjeta en Suscripción y Servicios para no perder el acceso.",
        ],
      },
      {
        q: "¿Cómo cancelo?",
        a: [
          "Abre Suscripción y Servicios y elige cancelar.",
          "Conservas el acceso hasta el final del periodo que ya pagaste.",
        ],
      },
      {
        q: "¿Ayudan a implementar y capacitar al personal?",
        a: [
          "Sí. En Suscripción y Servicios puedes contratar servicios de onboarding y capacitación.",
          "Cubren al administrador, vigilantes y residentes.",
        ],
      },
    ],
  },
]

const SOPORTE_EMAIL = "soporte@gatekeeper-app.org"
const SOPORTE_TEL = "+51 964 462 645"
const SOPORTE_WA = "51964462645"

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [catId, setCatId] = useState<string | null>(null)
  const [itemIdx, setItemIdx] = useState<number | null>(null)
  const [soporte, setSoporte] = useState(false)

  const category = CATEGORIES.find((c) => c.id === catId) ?? null
  const answer =
    category && itemIdx !== null ? category.items[itemIdx] : null

  function reset() {
    setCatId(null)
    setItemIdx(null)
    setSoporte(false)
  }

  function close() {
    setOpen(false)
    reset()
  }

  function back() {
    if (itemIdx !== null) setItemIdx(null)
    else if (catId) setCatId(null)
    else if (soporte) setSoporte(false)
  }

  const showBack = catId !== null || soporte

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 print:hidden">
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Centro de ayuda de Gatekeeper"
          className="flex w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
          style={{ maxHeight: "min(70vh, 34rem)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            {showBack ? (
              <button
                onClick={back}
                aria-label="Volver"
                className="rounded-md p-1 transition-colors hover:bg-white/15"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">
                <LifeBuoy className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {answer
                  ? category?.label
                  : category
                  ? category.label
                  : soporte
                  ? "Contactar soporte"
                  : "Centro de ayuda"}
              </p>
              <p className="truncate text-[11px] leading-tight text-primary-foreground/70">
                {answer ? "Respuesta" : "Gatekeeper"}
              </p>
            </div>
            <button
              onClick={close}
              aria-label="Cerrar"
              className="rounded-md p-1 transition-colors hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* HOME */}
            {!category && !soporte && (
              <div className="space-y-3">
                <p className="px-1 text-sm text-muted-foreground">
                  Hola 👋 ¿Con qué te ayudamos? Elige un tema:
                </p>
                <div className="space-y-1.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCatId(cat.id)}
                        className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                            cat.accent
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1 text-sm font-medium">
                          {cat.label}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CATEGORY (lista de preguntas) */}
            {category && !answer && (
              <div className="space-y-1.5">
                {category.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setItemIdx(i)}
                    className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex-1 text-sm font-medium leading-snug">
                      {item.q}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* ANSWER */}
            {answer && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold leading-snug">{answer.q}</h3>
                <ol className="space-y-2">
                  {answer.a.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  ¿No resolvió tu duda?{" "}
                  <button
                    onClick={() => {
                      setCatId(null)
                      setItemIdx(null)
                      setSoporte(true)
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Contactar soporte
                  </button>
                </div>
              </div>
            )}

            {/* SOPORTE */}
            {soporte && (
              <div className="space-y-2">
                <p className="px-1 text-sm text-muted-foreground">
                  ¿Prefieres hablar con una persona? Escríbenos:
                </p>
                <a
                  href={`https://wa.me/${SOPORTE_WA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">WhatsApp</span>
                    <span className="block text-xs text-muted-foreground">
                      {SOPORTE_TEL}
                    </span>
                  </span>
                </a>
                <a
                  href={`mailto:${SOPORTE_EMAIL}`}
                  className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Correo</span>
                    <span className="block text-xs text-muted-foreground">
                      {SOPORTE_EMAIL}
                    </span>
                  </span>
                </a>
                <a
                  href={`tel:${SOPORTE_TEL.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Teléfono</span>
                    <span className="block text-xs text-muted-foreground">
                      {SOPORTE_TEL}
                    </span>
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2">
            {soporte ? (
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al inicio
              </button>
            ) : (
              <a
                href="/manual"
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Ver manual completo
              </a>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante pequeño */}
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Cerrar ayuda" : "Abrir centro de ayuda"}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircleQuestion className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}
