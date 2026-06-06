import Link from "next/link"
import { Shield, Building2, UserCheck, Home, ChevronRight } from "lucide-react"

export const metadata = {
  title: "Manual de uso — Gatekeeper",
  description: "Guía completa para administradores, vigilantes y residentes de Gatekeeper.",
}

const MANUAL_URL = "https://gatekeeper-app.org/manual"

function Section({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: React.ElementType
  color: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className={`${color} px-6 py-4 flex items-center gap-3`}>
        <Icon className="h-5 w-5 text-white" />
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  )
}

function Subsection({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-foreground mb-2">{title}</h3>
      <ol className="space-y-1.5 list-decimal list-inside">
        {steps.map((step, i) => (
          <li key={i} className="text-sm text-muted-foreground leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: step }} />
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Gatekeeper</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Iniciar sesión →
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
            <Shield className="h-3.5 w-3.5" />
            Manual de uso
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Guía de Gatekeeper</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Todo lo que necesitas saber para empezar a usar la plataforma.
            Comparte este enlace con tu equipo:{" "}
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{MANUAL_URL}</span>
          </p>
        </div>

        {/* Índice rápido */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ir a sección</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "#administrador", label: "Administrador" },
              { href: "#vigilante", label: "Vigilante" },
              { href: "#residente", label: "Residente" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* ADMIN */}
        <div id="administrador">
          <Section icon={Building2} color="bg-primary" title="Guía del Administrador">
            <Subsection
              title="Agregar residentes y vigilantes"
              steps={[
                "Accede al panel e ingresa a <strong>Usuarios</strong> en el menú lateral.",
                "Haz clic en <strong>Nuevo usuario</strong>.",
                "Ingresa nombre, email y asigna el rol: <strong>RESIDENTE</strong> o <strong>VIGILANTE</strong>.",
                "Copia y comparte las credenciales con cada usuario.",
              ]}
            />
            <Subsection
              title="Reportes y exportación"
              steps={[
                "Ve a <strong>Reportes</strong> para ver visitas por día, por residente y vehículos frecuentes.",
                "Exporta los datos a <strong>Excel o PDF</strong> con un clic.",
              ]}
            />
            <Subsection
              title="Auditoría"
              steps={[
                "En <strong>Auditoría</strong> puedes ver el historial completo de acciones de todos los usuarios: ingresos registrados, cambios de configuración y más.",
              ]}
            />
            <Subsection
              title="Alertas"
              steps={[
                "En <strong>Alertas</strong> marca vehículos o personas que requieran seguimiento especial.",
                "El vigilante verá una advertencia cuando intente registrar ese vehículo.",
              ]}
            />
            <Subsection
              title="Gestión de suscripción y servicios"
              steps={[
                "Ve a <strong>Suscripción y Servicios</strong> en el menú para cambiar de plan, cancelar o contratar servicios adicionales de implementación y capacitación.",
              ]}
            />
          </Section>
        </div>

        {/* VIGILANTE */}
        <div id="vigilante">
          <Section icon={UserCheck} color="bg-green-600" title="Guía del Vigilante">
            <Subsection
              title="Iniciar turno"
              steps={[
                "Inicia sesión en <strong>gatekeeper-app.org</strong> con tus credenciales.",
                'Pulsa <strong>Iniciar turno</strong> para activar el registro de accesos. Sin turno activo no podrás registrar ingresos.',
              ]}
            />
            <Subsection
              title="Registrar ingreso de un visitante"
              steps={[
                "Escribe la placa en el buscador (funciona bien en celular).",
                "Confirma los datos del visitante y del residente al que visita.",
                'Pulsa <strong>Registrar ingreso</strong>. El residente recibirá una notificación automática por email.',
              ]}
            />
            <Subsection
              title="Registrar salida"
              steps={[
                'Ve a la sección <strong>Dentro</strong> para ver los vehículos que están en el condominio.',
                'Busca el vehículo y pulsa <strong>Registrar salida</strong>. El residente recibirá otra notificación.',
              ]}
            />
            <Subsection
              title="Finalizar turno"
              steps={[
                'Al terminar tu jornada, pulsa <strong>Finalizar turno</strong>. Esto cierra el período de registro.',
              ]}
            />
          </Section>
        </div>

        {/* RESIDENTE */}
        <div id="residente">
          <Section icon={Home} color="bg-blue-600" title="Guía del Residente">
            <Subsection
              title="Registrar una visita"
              steps={[
                'Ve a <strong>Nueva Visita</strong> en el menú.',
                "Ingresa el nombre del visitante, la placa del vehículo y la fecha y hora esperada.",
                'Se generará un <strong>código QR</strong> que puedes compartir por WhatsApp o email con tu visitante.',
              ]}
            />
            <Subsection
              title="Plantillas de visitas frecuentes"
              steps={[
                'En <strong>Plantillas</strong> guarda los datos de visitantes recurrentes (familia, delivery habitual, etc.).',
                "Úsalas para crear nuevas visitas en segundos sin volver a escribir los datos.",
              ]}
            />
            <Subsection
              title="Historial de visitas"
              steps={[
                'En <strong>Historial</strong> puedes ver todas tus visitas pasadas con horarios de ingreso y salida registrados por el vigilante.',
              ]}
            />
            <Subsection
              title="Notificaciones"
              steps={[
                "Recibirás un email automático cada vez que tu visitante ingrese al condominio.",
                "También recibirás un email cuando tu visitante salga, incluyendo el tiempo de permanencia.",
              ]}
            />
          </Section>
        </div>

        {/* Soporte */}
        <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-2">
          <p className="font-semibold">¿Necesitas ayuda?</p>
          <p className="text-sm text-muted-foreground">
            Escríbenos a{" "}
            <a href="mailto:soporte@gatekeeper-app.org" className="text-primary hover:underline font-medium">
              soporte@gatekeeper-app.org
            </a>{" "}
            o al{" "}
            <a href="tel:+51964462645" className="text-primary hover:underline font-medium">
              +51 964 462 645
            </a>
          </p>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t mt-12 py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2026 Gatekeeper — <Link href="/" className="hover:underline">gatekeeper-app.org</Link>
        </p>
      </footer>
    </div>
  )
}
