import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingNav } from "@/components/layout/landing-nav"
import {
  Shield, ShieldCheck, Lock, Car, Users, BarChart3, CheckCircle2,
  Bell, FileSpreadsheet, Phone, Mail, MapPin, Building2, QrCode,
  ScanLine, Clock, MessageCircle, Database, ClipboardList, KeyRound,
  Zap, Headset, X, Smartphone,
} from "lucide-react"

const WHATSAPP = "https://wa.me/51964462645"
const WHATSAPP_DEMO =
  "https://wa.me/51964462645?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Gatekeeper%20para%20mi%20condominio"
const WHATSAPP_ADMIN =
  "https://wa.me/51964462645?text=Hola%2C%20administro%20varios%20edificios%20y%20quiero%20conocer%20Gatekeeper"

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
      <header className="border-b sticky top-0 z-40 bg-background/90 backdrop-blur">
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

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="container max-w-6xl mx-auto px-4 py-20 sm:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
                Control de visitas y accesos para condominios y edificios con vigilancia
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Más seguridad y menos conflictos{" "}
                <span className="text-orange-400">en la puerta de tu condominio.</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Dale a tu administración el control y el respaldo que un cuaderno no puede dar:
                quién entró, quién lo autorizó y cuándo, todo registrado. Residentes más tranquilos
                y reportes claros para la junta. Sin instalar nada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/registro">
                  <Button size="lg" className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-700 text-white">
                    Crear cuenta gratis
                  </Button>
                </Link>
                <a href={WHATSAPP_DEMO} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-400" /> Sin tarjeta</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-400" /> Sin permanencia</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-400" /> Datos protegidos</span>
              </div>
            </div>

            {/* Mockup */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white/90">Garita · Registro de ingreso</span>
                <span className="text-xs font-bold text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-full">En turno</span>
              </div>
              <div className="rounded-xl bg-white text-slate-900 p-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-slate-500">
                  <ScanLine className="h-4 w-4" /> Buscar por placa o DNI…
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 border p-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <Car className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">ABC-123 · Juan Pérez</p>
                    <p className="text-xs text-slate-500">Visita a Dpto. 402</p>
                  </div>
                  <span className="text-[11px] font-bold text-green-700 bg-green-500/15 px-2 py-1 rounded-full">Autorizado</span>
                </div>
                <div className="w-full rounded-lg bg-orange-600 text-white text-center text-sm font-semibold py-2.5">
                  Registrar ingreso
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
                <Bell className="h-3.5 w-3.5 text-orange-300" /> El residente recibe un aviso automático del ingreso.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUIÉN */}
      <section className="border-b bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Pensado para
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-foreground/80">
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Condominios cerrados</span>
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Edificios y complejos multifamiliares con vigilancia</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Urbanizaciones</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Empresas administradoras</span>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-3xl font-bold">El cuaderno de la garita ya no alcanza</h2>
          <p className="text-muted-foreground">
            El papel no protege a tu administración: cuando hay un reclamo o un incidente, no hay con qué responder.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, t: "Sin respaldo ante un incidente", d: "Si algo pasa, el cuaderno no prueba quién entró ni quién lo autorizó. La administración queda expuesta frente a residentes y junta." },
            { icon: ClipboardList, t: "Reclamos de los residentes", d: "Colas en la puerta, visitas mal anotadas y quejas que terminan en la mesa de la administración." },
            { icon: BarChart3, t: "Cero visibilidad para la junta", d: "Sin reportes ni datos confiables no hay cómo rendir cuentas ni demostrar que la seguridad está bajo control." },
          ].map((p) => {
            const Icon = p.icon
            return (
              <div key={p.t} className="rounded-xl border p-6 space-y-3">
                <div className="inline-flex p-3 rounded-lg bg-red-500/10">
                  <Icon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg">{p.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.d}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CÓMO FUNCIONA EN 3 PASOS */}
      <section className="border-t">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-3xl font-bold">Así de simple. Y todo queda registrado.</h2>
            <p className="text-muted-foreground">
              El residente decide quién entra, el visitante llega con su pase y el vigilante solo confirma. En segundos.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "1", icon: Smartphone, t: "El residente autoriza", d: "Desde su celular, el residente registra a su visita con el DNI (y la placa, si viene en auto). Nadie entra sin que el residente lo autorice." },
              { n: "2", icon: MessageCircle, t: "El visitante recibe su pase QR", d: "Gatekeeper genera un pase QR que el residente le envía por WhatsApp. Sin llamadas a la garita ni esperas." },
              { n: "3", icon: CheckCircle2, t: "El vigilante confirma", d: "En la puerta, el vigilante escanea el QR o busca por DNI o placa y confirma el ingreso con un toque. Queda registrado quién entró, quién lo autorizó y cuándo." },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="relative rounded-xl border bg-background p-6 pt-8 space-y-3">
                  <div className="absolute -top-4 left-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-sm">
                    {s.n}
                  </div>
                  <div className="inline-flex p-3 rounded-lg bg-orange-500/10">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{s.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
                </div>
              )
            })}
          </div>
          <p className="text-center text-muted-foreground text-sm mt-10 max-w-2xl mx-auto">
            El vigilante ya no anota a mano. El residente decide. Y la administración tiene la prueba.
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA / ROLES */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-20 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold">Una plataforma, tres roles</h2>
            <p className="text-muted-foreground">
              El residente registra su visita, el vigilante la verifica en la puerta y la
              administración lo ve todo. Cada quien hace lo suyo en segundos, desde el celular o la computadora.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Users, color: "text-blue-500 bg-blue-500/10",
                title: "Residente",
                description: "Es quien registra a su visita con anticipación y comparte un código QR por WhatsApp. Recibe avisos cuando entra y sale.",
              },
              {
                icon: Car, color: "text-green-500 bg-green-500/10",
                title: "Vigilante",
                description: "Verifica la visita en la puerta: busca por placa o DNI, o escanea el QR. Registra el ingreso y la salida con un toque, desde el móvil.",
              },
              {
                icon: BarChart3, color: "text-purple-500 bg-purple-500/10",
                title: "Administrador",
                description: "Ve reportes con gráficas, auditoría completa, alertas y exporta a Excel o PDF para la junta.",
              },
            ].map((f) => {
              const Icon = f.icon
              const [textColor, bgColor] = f.color.split(" ")
              return (
                <div key={f.title} className="rounded-xl border bg-background p-6 space-y-4">
                  <div className={`inline-flex p-3 rounded-lg ${bgColor}`}>
                    <Icon className={`h-6 w-6 ${textColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-3xl font-bold">Por qué Gatekeeper</h2>
          <p className="text-muted-foreground">Lo que hace tu cuaderno, pero rápido, seguro y sin papeles.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ScanLine, t: "Por placa o DNI", d: "Admite visitas en auto o a pie. Búsqueda al instante." },
            { icon: QrCode, t: "QR por WhatsApp", d: "El residente envía el pase al visitante. La garita solo escanea." },
            { icon: Zap, t: "Sin hardware", d: "100% en la nube. Funciona desde cualquier celular o PC." },
            { icon: Building2, t: "Varios edificios", d: "Cada uno con su cuenta y su administrador, todos con el mismo sistema." },
          ].map((d) => {
            const Icon = d.icon
            return (
              <div key={d.t} className="rounded-xl border p-6 space-y-3">
                <div className="inline-flex p-3 rounded-lg bg-orange-500/10">
                  <Icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">{d.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{d.d}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* SEGURIDAD Y DATOS */}
      <section className="border-t bg-slate-900 text-white">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-orange-400" /> Seguridad y protección de datos
              </div>
              <h2 className="text-3xl font-bold">Tu información y la de tus residentes, protegidas</h2>
              <p className="text-slate-300">
                Manejas datos sensibles como DNI y placas. Gatekeeper está construido para cuidarlos y
                cumplir con la Ley N° 29733 de Protección de Datos Personales del Perú.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, t: "Cumplimiento Ley 29733", d: "Tratamiento responsable de datos personales." },
                { icon: KeyRound, t: "Accesos por rol", d: "Cada usuario ve solo lo que le corresponde." },
                { icon: Database, t: "Datos en la nube", d: "Respaldados y disponibles cuando los necesitas." },
                { icon: ClipboardList, t: "Auditoría completa", d: "Historial de cada acción para respaldar a la administración." },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.t} className="rounded-xl border border-white/15 bg-white/5 p-5 space-y-2">
                    <Icon className="h-6 w-6 text-orange-400" />
                    <h3 className="font-semibold">{s.t}</h3>
                    <p className="text-slate-400 text-sm">{s.d}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="border-t" id="planes">
        <div className="container max-w-6xl mx-auto px-4 py-20 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Dos planes. Sin letra chica.</h2>
            <p className="text-muted-foreground">
              Empieza gratis y sin fecha de vencimiento. Sin tarjeta, sin contratos, sin permanencia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                nombre: "Gratis", precio: "S/ 0", periodo: "para siempre", slug: "GRATIS",
                gradient: "from-slate-600 to-slate-800", icon: Shield,
                descripcion: "Para empezar hoy mismo. No caduca y no pedimos tarjeta.",
                features: [
                  "Hasta 15 residentes",
                  "2 vigilantes",
                  "50 visitas al mes",
                  "Pase QR por WhatsApp",
                  "Acceso por placa o DNI",
                  "Historial de 30 días",
                ],
              },
              {
                nombre: "Pro", precio: "S/ 89", periodo: "/mes", slug: "PRO",
                gradient: "from-primary to-primary/70", icon: BarChart3,
                descripcion: "Cuando el edificio crece y la administración necesita respaldo.",
                features: [
                  "Residentes ilimitados",
                  "Vigilantes ilimitados",
                  "Visitas sin límite práctico",
                  "Aviso por correo al residente",
                  "Reportes y exportación",
                  "Historial completo",
                  "Empresas (coworking y oficinas)",
                  "Soporte prioritario",
                ],
                destacado: true,
              },
            ].map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.nombre}
                  className={`rounded-xl border overflow-hidden ${plan.destacado ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
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
                    {/* Pro va directo al checkout; Gratis al alta sin tarjeta. */}
                    <Link
                      href={plan.destacado ? `/checkout?plan=${plan.slug}` : "/registro"}
                      className="block"
                    >
                      <Button variant={plan.destacado ? "default" : "outline"} className="w-full">
                        {plan.destacado ? "Contratar Pro" : "Crear cuenta gratis"}
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
            <p className="text-center text-muted-foreground text-sm">
              Te acompañamos en la puesta en marcha para que arranques sin complicaciones.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Bell, gradient: "from-amber-400 to-amber-600", slug: "onboarding",
                  nombre: "Onboarding y Configuración", precio: "S/ 59", periodo: "pago único",
                  descripcion: "Configuramos Gatekeeper en tu condominio: carga de residentes, creación de usuarios y puesta en marcha. Incluye 1 sesión de acompañamiento remoto.",
                },
                {
                  icon: FileSpreadsheet, gradient: "from-teal-500 to-teal-700", slug: "capacitacion",
                  nombre: "Capacitación del Personal", precio: "S/ 29", periodo: "pago único",
                  descripcion: "Capacitamos a tus vigilantes, residentes y administradores en el uso de la plataforma. Incluye sesión de preguntas en vivo.",
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
                      <Link href={`/contratar-servicio?tipo=${srv.slug}`} className="block">
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

      {/* EMPRESAS ADMINISTRADORAS */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <div className="rounded-2xl bg-slate-900 text-white p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
              <Building2 className="h-3.5 w-3.5 text-orange-400" /> Para empresas administradoras
            </div>
            <h2 className="text-3xl font-bold">¿Administras varios edificios?</h2>
            <p className="text-slate-300">
              Cada edificio con su propia cuenta y su propio administrador, y los datos de uno
              aislados de los demás. Sumas edificios cuando los necesites, siempre al mismo
              precio por edificio y sin contratos de permanencia.
            </p>
            <a href={WHATSAPP_ADMIN} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                <MessageCircle className="h-4 w-4" /> Hablar con el equipo
              </Button>
            </a>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Building2, t: "Una cuenta por edificio", d: "Cada uno opera solo, sin depender del resto." },
              { icon: Lock, t: "Datos aislados", d: "Nadie ve la información de otro edificio." },
              { icon: Headset, t: "Soporte directo", d: "Nos escribes y te respondemos nosotros." },
              { icon: KeyRound, t: "Precio fijo", d: "S/ 89 al mes por edificio. Sin sorpresas." },
            ].map((a) => {
              const Icon = a.icon
              return (
                <div key={a.t} className="rounded-xl border border-white/15 bg-white/5 p-5 space-y-2">
                  <Icon className="h-6 w-6 text-orange-400" />
                  <h3 className="font-semibold text-sm">{a.t}</h3>
                  <p className="text-slate-400 text-xs">{a.d}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* GARANTÍAS / RIESGO */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            {[
              { icon: Clock, t: "Gratis sin caducidad", d: "El plan Gratis no vence ni pide tarjeta." },
              { icon: X, t: "Sin permanencia", d: "Cancela cuando quieras, sin penalidades." },
              { icon: Headset, t: "Te acompañamos", d: "Onboarding y capacitación para tu equipo." },
            ].map((g) => {
              const Icon = g.icon
              return (
                <div key={g.t} className="space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{g.t}</h3>
                  <p className="text-muted-foreground text-sm">{g.d}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
          <p className="text-muted-foreground">Lo que suelen consultarnos las administraciones.</p>
        </div>
        <div className="space-y-3">
          {[
            { q: "¿Necesito comprar algún equipo o instalar algo?", a: "No. Gatekeeper funciona 100% en la nube desde el navegador. Tu vigilante puede usarlo desde un celular con internet." },
            { q: "¿Qué pasa con los datos de los visitantes?", a: "Se tratan de forma responsable y conforme a la Ley N° 29733. Cada usuario accede solo a lo que le corresponde y queda registro de las acciones." },
            { q: "¿Capacitan a mi personal?", a: "Sí. Ofrecemos onboarding y capacitación para vigilantes, residentes y administradores, para que arranquen sin complicaciones." },
            { q: "¿Hay contrato de permanencia?", a: "No. El plan Gratis no caduca y no pide tarjeta. Si pasas a Pro es mes a mes y puedes cancelar cuando quieras." },
            { q: "¿Sirve para edificios y urbanizaciones, no solo condominios?", a: "Sí. Funciona en cualquier inmueble con vigilancia: condominios cerrados, edificios y complejos multifamiliares con vigilante, urbanizaciones y empresas que administran varios inmuebles." },
            { q: "¿Cómo registra el vigilante a una visita?", a: "Por placa o DNI, o escaneando el código QR que el residente envió por WhatsApp. Registra ingreso y salida con un toque." },
          ].map((item) => (
            <details key={item.q} className="rounded-xl border px-5 bg-background group">
              <summary className="flex items-center justify-between cursor-pointer py-4 font-semibold list-none">
                {item.q}
                <span className="text-primary text-xl group-open:hidden">+</span>
                <span className="text-primary text-xl hidden group-open:inline">−</span>
              </summary>
              <p className="text-muted-foreground text-sm pb-4 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <div className="rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 text-white text-center p-12 space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold">Digitaliza la seguridad de tu condominio hoy</h2>
            <p className="text-white/90 max-w-xl mx-auto">
              Empieza gratis en minutos. Sin tarjeta, sin instalaciones, sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/registro">
                <Button size="lg" className="w-full sm:w-auto px-8 bg-white text-orange-600 hover:bg-white/90">
                  Crear cuenta gratis
                </Button>
              </Link>
              <a href={WHATSAPP_DEMO} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Información de contacto</h2>
            <p className="text-muted-foreground text-sm">Estamos disponibles para atender tus consultas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Teléfono / WhatsApp</p>
              <span className="text-muted-foreground text-sm hover:text-foreground transition-colors">+51 964 462 645</span>
            </a>
            <a href="mailto:soporte@gatekeeper-app.org" className="flex flex-col items-center gap-2 text-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Correo electrónico</p>
              <span className="text-muted-foreground text-sm hover:text-foreground transition-colors">soporte@gatekeeper-app.org</span>
            </a>
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

      {/* FOOTER */}
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
              <Link href="/manual" className="hover:text-foreground transition-colors">Manual</Link>
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

      {/* WhatsApp flotante */}
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  )
}
