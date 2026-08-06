import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Términos y Condiciones — Gatekeeper",
}

export default function TerminosPage() {
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
          <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
          <p className="text-muted-foreground text-sm">Última actualización: 15 de mayo de 2026</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Identificación del proveedor</h2>
            <p>
              El presente servicio es prestado por <strong>Josue Antonio Medina Bocanegra</strong>,
              con RUC <strong>10460632027</strong>, con domicilio en Calle 39 Nº 111, Lima, Perú.
              Correo de contacto: <a href="mailto:welfareorga@gmail.com" className="text-primary underline">welfareorga@gmail.com</a>.
              Teléfono: +51 964 462 645.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Descripción del servicio</h2>
            <p>
              Gatekeeper es una plataforma web SaaS (Software como Servicio) para la gestión de accesos vehiculares
              en condominios y urbanizaciones cerradas. El servicio incluye:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Portal web para residentes: registro y programación de visitas, generación de códigos QR.</li>
              <li>Módulo de vigilante: control de ingreso y salida de vehículos en tiempo real.</li>
              <li>Panel administrativo: reportes, auditoría, exportación de datos, gestión de usuarios.</li>
              <li>Notificaciones automáticas por correo electrónico al residente.</li>
              <li>Acceso multidispositivo (PC, tablet, móvil) sin necesidad de instalar software.</li>
            </ul>
            <p>
              El acceso al servicio se realiza a través de <strong>https://gatekeeper-phi.vercel.app</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Planes y precios</h2>
            <p>Los planes disponibles y sus tarifas mensuales son:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Plan Gratis:</strong> S/ 0.00 — hasta 15 residentes, 2 vigilantes, 50 visitas al mes, historial de 30 días. Sin fecha de vencimiento.</li>
              <li><strong>Plan Pro:</strong> S/ 89.00/mes — residentes y vigilantes ilimitados, historial completo, reportes, notificaciones por correo y empresas.</li>
              <li><strong>Plan Premium:</strong> S/ 149.00/mes — sin límite de residentes y vigilantes, historial ilimitado, reportes avanzados, soporte dedicado.</li>
              <li><strong>Onboarding y Configuración:</strong> S/ 59.00 (pago único) — implementación inicial del sistema.</li>
              <li><strong>Capacitación del Personal:</strong> S/ 29.00 (pago único) — sesión de capacitación para vigilantes y administradores.</li>
            </ul>
            <p>Todos los precios incluyen IGV. Los precios pueden modificarse con previo aviso de 30 días.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Registro y cuenta</h2>
            <p>
              Para acceder al servicio, el condominio debe registrarse proporcionando información veraz.
              El administrador es responsable de mantener la confidencialidad de las credenciales de acceso.
              Se prohíbe compartir el acceso con terceros no autorizados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Pagos</h2>
            <p>
              Los pagos se procesan a través de <strong>Culqi</strong>, plataforma de pagos segura certificada PCI DSS.
              Se aceptan tarjetas de débito y crédito Visa, Mastercard y American Express emitidas en Perú.
              La suscripción se renueva automáticamente cada mes hasta que el cliente la cancele.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Cancelación y devoluciones</h2>
            <p>
              El cliente puede cancelar su suscripción en cualquier momento desde su panel de administración
              o comunicándose con soporte. Ver la{" "}
              <Link href="/politica-devoluciones" className="text-primary underline">
                Política de Cambios y Devoluciones
              </Link>{" "}
              para más detalles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Período de prueba</h2>
            <p>
              El plan Gratis no caduca y no requiere ingresar datos
              de pago. Al finalizar el período de prueba, el servicio se suspenderá hasta que el cliente
              contrate un plan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Disponibilidad del servicio</h2>
            <p>
              Nos comprometemos a una disponibilidad del 99% mensual. El mantenimiento programado se
              notificará con al menos 24 horas de anticipación. No somos responsables de interrupciones
              causadas por terceros (proveedores de internet, fuerza mayor).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Privacidad de datos</h2>
            <p>
              Los datos personales registrados en la plataforma son tratados conforme a la Ley N° 29733,
              Ley de Protección de Datos Personales del Perú. No compartimos datos con terceros salvo
              obligación legal. Los datos del condominio son propiedad del cliente y pueden ser exportados
              o eliminados a solicitud.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Limitación de responsabilidad</h2>
            <p>
              Gatekeeper no se responsabiliza por daños derivados del uso indebido del sistema, errores
              en los datos ingresados por los usuarios, ni por hechos de seguridad física ocurridos en
              el condominio. El sistema es una herramienta de apoyo, no reemplaza la responsabilidad del
              personal de seguridad.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Resolución de controversias</h2>
            <p>
              Ante cualquier controversia, las partes se someten a los órganos competentes del Perú.
              El cliente puede presentar reclamos ante INDECOPI a través de nuestro{" "}
              <Link href="/libro-reclamaciones" className="text-primary underline">
                Libro de Reclamaciones
              </Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos. Los cambios serán notificados por
              correo electrónico con al menos 15 días de anticipación. El uso continuado del servicio
              tras la modificación implica aceptación de los nuevos términos.
            </p>
          </section>

        </div>

        <div className="border-t pt-6 flex gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">← Volver al inicio</Link>
          <Link href="/politica-devoluciones" className="text-primary hover:underline">Política de devoluciones</Link>
          <Link href="/libro-reclamaciones" className="text-primary hover:underline">Libro de reclamaciones</Link>
        </div>
      </main>
    </div>
  )
}
