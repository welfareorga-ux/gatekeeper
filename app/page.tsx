import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Car, Users, BarChart3, CheckCircle2 } from "lucide-react"

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
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/registro">
              <Button size="sm">Registrar mi condominio</Button>
            </Link>
          </div>
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
          <Link href="/registro">
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
      <section className="border-t">
        <div className="container max-w-6xl mx-auto px-4 py-20 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Planes simples y transparentes</h2>
            <p className="text-muted-foreground">Sin contratos. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { nombre: "Básico", precio: "S/ 49", periodo: "/mes", features: ["Hasta 50 residentes", "1 vigilante", "Historial 30 días", "Soporte por email"] },
              { nombre: "Estándar", precio: "S/ 89", periodo: "/mes", features: ["Hasta 150 residentes", "3 vigilantes", "Historial 90 días", "Reportes y exportación", "Soporte prioritario"], destacado: true },
              { nombre: "Premium", precio: "S/ 149", periodo: "/mes", features: ["Residentes ilimitados", "Vigilantes ilimitados", "Historial ilimitado", "Reportes avanzados", "Soporte dedicado"] },
            ].map((plan) => (
              <div
                key={plan.nombre}
                className={`rounded-xl border p-6 space-y-5 ${plan.destacado ? "border-primary shadow-lg shadow-primary/10" : ""}`}
              >
                {plan.destacado && (
                  <div className="text-xs font-semibold text-primary uppercase tracking-wide">Más popular</div>
                )}
                <div>
                  <p className="font-bold text-xl">{plan.nombre}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-bold">{plan.precio}</span>
                    <span className="text-muted-foreground text-sm mb-1">{plan.periodo}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className="block">
                  <Button variant={plan.destacado ? "default" : "outline"} className="w-full">
                    Comenzar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Gatekeeper © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
            <Link href="/registro" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
