import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  alternates: { canonical: "/politica-devoluciones" },
  title: "Política de Cambios y Devoluciones — Gatekeeper",
}

export default function PoliticaDevolucionesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Gatekeeper</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Política de Cambios y Devoluciones</h1>
          <p className="text-muted-foreground text-sm">Última actualización: 15 de mayo de 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Naturaleza del servicio</h2>
            <p>
              Gatekeeper es un servicio de software por suscripción (SaaS). Al tratarse de un servicio
              digital de acceso inmediato, las condiciones de devolución se aplican conforme a lo
              establecido en el Código de Protección y Defensa del Consumidor del Perú (Ley N° 29571)
              y las directrices de INDECOPI.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Período de prueba gratuita</h2>
            <p>
              Puedes usar el <strong>plan Gratis</strong> sin cargo y sin fecha límite. Durante
              este período el cliente puede evaluar el servicio sin compromiso. No se realiza ningún
              cobro hasta que el período de prueba finalice y el cliente contrate un plan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Cancelación de suscripción mensual</h2>
            <p>El cliente puede cancelar su suscripción en cualquier momento:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Cancelación dentro de los primeros 7 días del período facturado:</strong> se
                realizará una devolución proporcional por los días no utilizados del mes, descontando
                una tarifa administrativa de procesamiento de S/ 10.00.
              </li>
              <li>
                <strong>Cancelación después del día 7 del período facturado:</strong> no se emite
                devolución por el mes en curso. El acceso al servicio se mantiene activo hasta el
                fin del período pagado.
              </li>
              <li>
                La cancelación no genera penalidad alguna sobre períodos futuros; el cliente
                simplemente deja de ser cobrado a partir del siguiente ciclo.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Servicios de pago único (Onboarding y Capacitación)</h2>
            <p>Para los servicios de pago único (Onboarding y Configuración / Capacitación del Personal):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Antes de la prestación del servicio:</strong> devolución del 100% del monto
                pagado, siempre que la solicitud se realice con al menos 48 horas de anticipación a
                la fecha programada.
              </li>
              <li>
                <strong>Con menos de 48 horas de anticipación:</strong> devolución del 50% del monto
                pagado.
              </li>
              <li>
                <strong>Una vez iniciado el servicio:</strong> no se realizan devoluciones, salvo
                fallo imputable al proveedor.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Fallo del servicio</h2>
            <p>
              Si Gatekeeper presenta una interrupción no programada de más de 48 horas continuas
              en un mes de facturación, el cliente tendrá derecho a solicitar una extensión del
              período equivalente al tiempo de interrupción o, de preferirlo, una devolución
              proporcional al tiempo no disponible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Cambio de plan</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Upgrade (plan mayor):</strong> el cambio es inmediato. Se cobra la diferencia
                proporcional por los días restantes del mes en curso.
              </li>
              <li>
                <strong>Downgrade (plan menor):</strong> el cambio aplica al inicio del siguiente
                período de facturación. No hay devolución por la diferencia del mes actual.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Procedimiento para solicitar devolución</h2>
            <p>Para solicitar una devolución, el cliente debe:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Enviar un correo a{" "}
                <a href="mailto:welfareorga@gmail.com" className="text-primary underline">
                  welfareorga@gmail.com
                </a>{" "}
                con el asunto <em>"Solicitud de devolución — [nombre del condominio]"</em>.
              </li>
              <li>Indicar el motivo de la solicitud y el número de transacción Culqi (si lo tiene).</li>
              <li>
                O llamar / escribir por WhatsApp al{" "}
                <a href="tel:+51964462645" className="text-primary underline">+51 964 462 645</a>.
              </li>
            </ol>
            <p>
              Responderemos dentro de <strong>3 días hábiles</strong>. Las devoluciones aprobadas se
              procesan en un plazo de <strong>5 a 10 días hábiles</strong> dependiendo del banco emisor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Reclamaciones</h2>
            <p>
              Si no estás conforme con nuestra respuesta, puedes registrar una queja o reclamo formal
              en nuestro{" "}
              <Link href="/libro-reclamaciones" className="text-primary underline">
                Libro de Reclamaciones
              </Link>{" "}
              o acudir a INDECOPI.
            </p>
          </section>

        </div>

        <div className="border-t pt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">← Volver al inicio</Link>
          <Link href="/terminos" className="text-primary hover:underline">Términos y condiciones</Link>
          <Link href="/libro-reclamaciones" className="text-primary hover:underline">Libro de reclamaciones</Link>
        </div>
      </main>
    </div>
  )
}
