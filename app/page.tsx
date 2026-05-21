import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingNav } from "@/components/layout/landing-nav"
import {
  Shield, Car, Users, BarChart3, CheckCircle2,
  Bell, FileSpreadsheet, Phone, Mail, MapPin, Building2,
} from "lucide-react"

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const { rol, isSuperAdmin } = session.user
    if (isSuperAdmin) redirect("/superadmin")
    if (rol === "ADMIN") redirect("/admin/dashboard")
    if (rol === "VIGILANTE") redirect("/vigilante")
    redirect("/residente/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Gatekeeper</span>
          </div>
          <LandingNav />
        </div>
      </header>

      {/* Hero */}
      <section className="container max-w-6xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
          <Shield className="h-3.5 w-3.5" />
          Sistema de control de acceso vehicular
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
          Gestiona los accesos<br />
          <span className="text-primary">de tu condominio</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Registra visitas, controla el ingreso de vehículos y mantén un historial completo.
          Todo desde una plataforma web, sin instalar nada.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/checkout?plan=ESTANDAR">
            <Button size="lg" className="w-full sm:w-auto px-8">
              Comenzar gratis — 14 días
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Portal del Residente",
              description: "Registra visitas con anticipación, genera códigos QR y compártelos por WhatsApp.",
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              icon: Car,
              title: "Control del Vigilante",
              description: "Búsqueda instantánea por placa, registro de ingreso/salida con un toque. Funciona en móvil.",
              color: "text-green-500 bg-green-500/10",
            },
            {
              icon: BarChart3,
              title: "Panel Administrativo",
              description: "Reportes con gráficas, auditoría completa, exportación a Excel y PDF.",
              color: "text-purple-500 bg-purple-500/10",
            },
          ].map((f) => {
            const Icon = f.icon
            const [textColor, bgColor] = f.color.split(" ")
            return (
              <div key={f.title} className="rounded-xl border p-6 space-y-4">
                <div className={`inline-flex p-3 rounded-lg ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${textColor}`} />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Planes */}
      <section className="border-t" id="planes">
        <div className="container max-w-6xl mx-auto px-4 py-20 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Planes simples y transparentes</h2>
            <p className="text-muted-foreground">Sin contratos. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                nombre: "Básico",
                precio: "S/ 49",
                periodo: "/mes",
                slug: "BASICO",
                gradient: "from-blue-500 to-blue-700",
                icon: Shield,
                descripcion: "Ideal para condominios pequeños que necesitan digitalizar su control de acceso.",
                features: ["Hasta 20 residentes", "1 vigilante", "Historial 30 días", "Soporte por email"],
              },
              {
                nombre: "Estándar",
                precio: "S/ 89",
                periodo: "/mes",
                slug: "ESTANDAR",
                gradient: "from-primary to-primary/70",
                icon: BarChart3,
                descripcion: "El más elegido. Perfecto para condominios medianos con múltiples vigilantes.",
                features: ["Hasta 50 residentes", "3 vigilantes", "Historial 90 días", "Reportes y exportación", "Soporte prioritario"],
                destacado: true,
              },
              {
                nombre: "Premium",
                precio: "S/ 149",
                periodo: "/mes",
                slug: "PREMIUM",
                gradient: "from-purple-500 to-purple-800",
                icon: Building2,
                descripcion: "Sin límites. Para grandes edificios y urbanizaciones con operación intensiva.",
                features: ["Residentes ilimitados", "Vigilantes ilimitados", "Historial ilimitado", "Reportes avanzados", "Soporte dedicado"],
              },
            ].map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.nombre}
                  className={`rounded-xl border overflow-hidden ${plan.destacado ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {/* Visual del plan */}
                  <div className={`bg-gradient-to-br ${plan.gradient} p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]`}>
                    {plan.destacado && (
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide bg-white/20 px-3 py-1 rounded-full">
                        Más popular
                      </span>
                    )}
                    <Icon className="h-10 w-10 text-white/90" />
                    <p className="text-white font-bold text-xl">{plan.nombre}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-white text-3xl font-bold">{plan.precio}</span>
                      <span className="text-white/70 text-sm mb-1">{plan.periodo}</span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{plan.descripcion}</p>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/checkout?plan=${plan.slug}`} className="block">
                      <Button
                        variant={plan.destacado ? "default" : "outline"}
                        className="w-full"
                      >
                        Comprar plan
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Servicios adicionales */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h3 className="text-center text-xl font-semibold pt-4">Servicios adicionales</h3>
            <p className="text-center text-muted-foreground text-sm">Complementa tu plan con servicios de implementación y capacitación.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Bell,
                  gradient: "from-amber-400 to-amber-600",
                  nombre: "Onboarding y Configuración",
                  precio: "S/ 99",
                  periodo: "pago único",
                  descripcion: "Configuramos Gatekeeper en tu condominio: carga de residentes, creación de usuarios y puesta en marcha. Incluye 1 sesión de acompañamiento remoto.",
                },
                {
                  icon: FileSpreadsheet,
                  gradient: "from-teal-500 to-teal-700",
                  nombre: "Capacitación del Personal",
                  precio: "S/ 79",
                  periodo: "pago único",
                  descripcion: "Capacitamos a tus vigilantes y administradores en el uso de la plataforma. Incluye manual de uso y sesión de preguntas en vivo.",
                },
              ].map((srv) => {
                const Icon = srv.icon
                return (
                  <div key={srv.nombre} className="rounded-xl border overflow-hidden">
                    <div className={`bg-gradient-to-br ${srv.gradient} p-5 flex items-center gap-4`}>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">{srv.nombre}</p>
                        <div className="flex items-end gap-1 mt-0.5">
                          <span className="text-white text-2xl font-bold">{srv.precio}</span>
                          <span className="text-white/70 text-xs mb-0.5">{srv.periodo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">{srv.descripcion}</p>
                      <Link href="/registro" className="block">
                        <Button variant="outline" className="w-full">Contratar servicio</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Información de contacto</h2>
            <p className="text-muted-foreground text-sm">Estamos disponibles para atender tus consultas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Teléfono / WhatsApp</p>
              <a href="tel:+51964462645" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                +51 964 462 645
              </a>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Correo electrónico</p>
              <a href="mailto:welfareorga@gmail.com" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                welfareorga@gmail.com
              </a>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Dirección</p>
              <p className="text-muted-foreground text-sm">Calle 39 Nº 111, Lima, Perú</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-bold">Gatekeeper</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Josue Antonio Medina Bocanegra — RUC 10460632027
              </p>
              <p className="text-xs text-muted-foreground">Calle 39 Nº 111, Lima, Perú</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
              <Link href="/registro" className="hover:text-foreground transition-colors">Registrarse</Link>
              <Link href="/terminos" className="hover:text-foreground transition-colors">Términos y condiciones</Link>
              <Link href="/politica-devoluciones" className="hover:text-foreground transition-colors">Política de devoluciones</Link>
              <Link href="/libro-reclamaciones" className="hover:text-foreground transition-colors">Libro de reclamaciones</Link>
            </div>
          </div>
          <div className="border-t pt-4 text-xs text-muted-foreground text-center">
            © 2026 Gatekeeper. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
