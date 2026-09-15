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
          <p className="text-muted-foreground text-sm">Última actualización: 15 de setiembre de 2026</p>
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
            <h2 className="text-xl font-semibold">2. Plan Gratis</h2>
            <p>
              El <strong>plan Gratis</strong> no es un período de prueba: no tiene costo, no vence y no
              pide datos de pago, por lo que no genera cobros ni devoluciones. Solo se cobra cuando el
              cliente contrata el plan Pro o compra un paquete de visitas extra.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Cancelación de suscripción</h2>
            <p>El cliente puede cancelar su suscripción en cualquier momento.</p>
            <p><strong>Pago mensual:</strong></p>
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
            <p><strong>Pago trimestral, semestral o anual (con descuento):</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Estos periodos se cobran por adelantado con un precio reducido (S/ 254 cada 3 meses,
                S/ 480 cada 6 meses o S/ 890 al año) y se renuevan automáticamente al mismo precio.
              </li>
              <li>
                Al cancelar, el acceso se mantiene activo hasta el final del periodo pagado y no se
                realizan más cobros. <strong>No se devuelven los meses restantes</strong> del periodo en curso.
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
                <strong>De Gratis a Pro:</strong> el cambio es inmediato y se cobra el periodo elegido
                completo (mensual, trimestral, semestral o anual). No hay cobros proporcionales.
              </li>
              <li>
                <strong>Cambiar el periodo de Pro</strong> (por ejemplo, de mensual a anual): escríbenos a
                soporte@gatekeeper-app.org. El nuevo periodo empieza cuando termina el que está pagado;
                no se cobra ni se devuelve ninguna diferencia.
              </li>
              <li>
                <strong>Dejar Pro:</strong> se hace cancelando la suscripción (ver sección 3). No hay
                devolución por el periodo en curso, salvo lo indicado para el pago mensual.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6-A. Paquetes de visitas extra</h2>
            <p>
              El paquete de 20 visitas extra (S/ 19.00, solo plan Gratis) es un pago único que vence al
              terminar el mes calendario en que se compró. Las visitas no usadas se pierden y no se
              reembolsan, salvo fallo imputable al proveedor.
            </p>
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
