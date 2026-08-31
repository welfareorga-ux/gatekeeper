import Link from "next/link"
import { LandingNav } from "@/components/layout/landing-nav"
import { Shield, Building2, UserCheck, Home, ChevronRight, ListOrdered, HelpCircle } from "lucide-react"

export const metadata = {
  alternates: { canonical: "/manual" },
  title: "Manual de uso — Gatekeeper",
  description:
    "Manual de Gatekeeper para administradores, vigilantes y residentes: puesta en marcha, registro de visitas, turnos, reportes y solución de problemas frecuentes.",
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

function Subsection({
  title,
  steps,
  nota,
}: {
  title: string
  steps: string[]
  nota?: string
}) {
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
      {nota && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-muted pl-3">
          <span dangerouslySetInnerHTML={{ __html: nota }} />
        </p>
      )}
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
          <LandingNav />
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
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Gatekeeper reemplaza el cuaderno de la garita por un registro digital: el
            residente anuncia a su visita, el vigilante la verifica en la puerta y el
            administrador ve todo lo que pasó, con fecha y hora. Este manual explica el
            trabajo diario de cada uno de los tres roles.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Puedes compartir este enlace con tu equipo:{" "}
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{MANUAL_URL}</span>
          </p>
        </div>

        {/* Índice rápido */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ir a sección</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "#primeros-pasos", label: "Primeros pasos" },
              { href: "#administrador", label: "Administrador" },
              { href: "#vigilante", label: "Vigilante" },
              { href: "#residente", label: "Residente" },
              { href: "#problemas", label: "Problemas frecuentes" },
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

        {/* PRIMEROS PASOS */}
        <div id="primeros-pasos">
          <Section icon={ListOrdered} color="bg-slate-800" title="Primeros pasos: el orden importa">
            <p className="text-sm text-muted-foreground leading-relaxed">
              La puesta en marcha falla casi siempre por el mismo motivo: se le pide al
              vigilante que use el sistema antes de que existan los residentes. Sin
              residentes cargados no hay a quién anunciar una visita, y la garita vuelve al
              cuaderno el primer día. Este es el orden que recomendamos.
            </p>
            <Subsection
              title="Semana 1 — Cargar a las personas"
              steps={[
                "El administrador entra a <strong>Usuarios</strong> y da de alta primero a los vigilantes, que son pocos.",
                "Luego carga a los residentes, empezando por una torre o sector, no por todo el condominio a la vez.",
                "Entrega las credenciales a cada persona y confirma que puedan entrar.",
              ]}
              nota="Cargar un sector primero permite corregir errores de datos con diez familias en lugar de con doscientas. Cuando ese sector funciona sin preguntas, el resto entra mucho más rápido."
            />
            <Subsection
              title="Semana 2 — Probar en la puerta"
              steps={[
                "Pide a dos o tres residentes del sector piloto que registren una visita real.",
                "Acompaña al vigilante en su primer turno para resolver dudas en el momento.",
                "Revisa en <strong>Reportes</strong> que los ingresos y salidas hayan quedado registrados.",
              ]}
              nota="El vigilante es quien decide si el sistema se usa o no. Si en su primer turno algo no funciona y nadie está para ayudarlo, vuelve al cuaderno y es muy difícil recuperarlo."
            />
            <Subsection
              title="Semana 3 — Extender y medir"
              steps={[
                "Carga el resto de sectores del condominio.",
                "Revisa los reportes semanalmente durante el primer mes.",
                "Marca en <strong>Alertas</strong> los casos que la junta haya pedido vigilar.",
              ]}
              nota="A partir del primer mes ya tienes datos propios para llevar a la junta de propietarios: cuántas visitas entran, en qué horarios y qué proveedores son los más frecuentes."
            />
          </Section>
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
              nota="El correo no es un dato de relleno: es por donde el residente recibe el aviso de que su visita llegó. Un correo mal escrito se traduce en un residente convencido de que el sistema no funciona. Conviene confirmarlo con cada familia antes de cargarlo."
            />
            <Subsection
              title="Reportes y exportación"
              steps={[
                "Ve a <strong>Reportes</strong> para ver visitas por día, por residente y vehículos frecuentes.",
                "Exporta los datos a <strong>Excel o PDF</strong> con un clic.",
              ]}
              nota="El PDF sirve para la carpeta de la junta y el Excel para cruzar datos por tu cuenta. La lista de vehículos frecuentes suele ser la más útil: deja ver de un vistazo qué proveedores entran tantas veces al mes que conviene darles un trato distinto."
            />
            <Subsection
              title="Auditoría"
              steps={[
                "En <strong>Auditoría</strong> puedes ver el historial completo de acciones de todos los usuarios: ingresos registrados, cambios de configuración y más.",
              ]}
              nota="Es la diferencia práctica con un cuaderno: cada acción queda con autor y hora, y nadie puede borrar una página. Cuando hay un reclamo, la auditoría responde quién registró qué y cuándo, sin depender de la memoria de nadie."
            />
            <Subsection
              title="Alertas"
              steps={[
                "En <strong>Alertas</strong> marca vehículos o personas que requieran seguimiento especial.",
                "El vigilante verá una advertencia cuando intente registrar ese vehículo.",
              ]}
              nota="Úsalo con criterio y deja constancia en el acta de la junta de por qué se marcó cada caso. Una alerta es información sensible sobre una persona, y conviene poder explicar la razón si algún día te la piden."
            />
            <Subsection
              title="Gestión de suscripción y servicios"
              steps={[
                "Ve a <strong>Suscripción y Servicios</strong> en el menú para cambiar de plan, cancelar o contratar servicios adicionales de implementación y capacitación.",
              ]}
              nota="Los servicios de implementación y capacitación son opcionales: sirven cuando el condominio es grande o cuando el personal de garita rota mucho y hay que formar gente nueva cada cierto tiempo."
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
              nota="El turno es lo que le pone tu nombre a cada registro del día. Si al llegar no puedes registrar a nadie, casi siempre es porque el turno no está iniciado: es lo primero que hay que revisar."
            />
            <Subsection
              title="Registrar ingreso de un visitante"
              steps={[
                "Escribe la placa en el buscador (funciona bien en celular).",
                "Confirma los datos del visitante y del residente al que visita.",
                'Pulsa <strong>Registrar ingreso</strong>. El residente recibirá una notificación automática por email.',
              ]}
              nota="Si la placa no aparece, puedes buscar por DNI o escanear el código QR que el residente le envió a su visitante. Que no aparezca suele significar que el residente todavía no la anunció, no que el sistema falle."
            />
            <Subsection
              title="Registrar salida"
              steps={[
                'Ve a la sección <strong>Dentro</strong> para ver los vehículos que están en el condominio.',
                'Busca el vehículo y pulsa <strong>Registrar salida</strong>. El residente recibirá otra notificación.',
              ]}
              nota="La pantalla Dentro es la foto de quién está en este momento en el condominio. Vale la pena mirarla antes de entregar el turno: si alguien figura adentro desde hace horas, o se olvidó registrar su salida o hay algo que revisar."
            />
            <Subsection
              title="Finalizar turno"
              steps={[
                'Al terminar tu jornada, pulsa <strong>Finalizar turno</strong>. Esto cierra el período de registro.',
              ]}
              nota="Cerrar el turno delimita qué registros son tuyos y cuáles del compañero que entra. Es también lo que permite que el administrador sepa después quién estaba en la puerta a una hora determinada."
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
              nota="Anunciar la visita antes de que llegue es lo que evita la llamada desde la garita y la espera en la puerta. Con el QR enviado, tu visitante entra aunque tú no contestes el teléfono en ese momento."
            />
            <Subsection
              title="Plantillas de visitas frecuentes"
              steps={[
                'En <strong>Plantillas</strong> guarda los datos de visitantes recurrentes (familia, delivery habitual, etc.).',
                "Úsalas para crear nuevas visitas en segundos sin volver a escribir los datos.",
              ]}
              nota="Sirven sobre todo para lo que se repite cada semana: la persona que ayuda en casa, el familiar que viene los domingos, el profesor particular. Se registran una vez y después son dos toques."
            />
            <Subsection
              title="Historial de visitas"
              steps={[
                'En <strong>Historial</strong> puedes ver todas tus visitas pasadas con horarios de ingreso y salida registrados por el vigilante.',
              ]}
              nota="Es tu propio registro, no el del condominio: solo ves tus visitas. Resulta útil cuando necesitas recordar qué día vino un técnico o a qué hora salió alguien."
            />
            <Subsection
              title="Notificaciones"
              steps={[
                "Recibirás un email automático cada vez que tu visitante ingrese al condominio.",
                "También recibirás un email cuando tu visitante salga, incluyendo el tiempo de permanencia.",
              ]}
              nota="Si no te llegan, revisa primero la carpeta de spam y marca el correo como deseado; después confirma con el administrador que tu dirección esté bien escrita en Usuarios."
            />
          </Section>
        </div>

        {/* PROBLEMAS FRECUENTES */}
        <div id="problemas">
          <Section icon={HelpCircle} color="bg-slate-700" title="Problemas frecuentes">
            <Subsection
              title="El vigilante no puede registrar ningún ingreso"
              steps={[
                "Verifica que haya pulsado <strong>Iniciar turno</strong> al empezar la jornada.",
                "Sin turno activo el registro queda bloqueado a propósito, para que ningún ingreso quede sin responsable.",
              ]}
            />
            <Subsection
              title="La placa del visitante no aparece en el buscador"
              steps={[
                "Comprueba si el residente llegó a registrar la visita: si no la anunció, no habrá nada que buscar.",
                "Intenta con el DNI del visitante o escanea el código QR.",
                "Revisa que la placa esté escrita igual que la registró el residente, sin espacios ni guiones de más.",
              ]}
            />
            <Subsection
              title="El residente dice que no le llegan los correos"
              steps={[
                "Pídele que revise la carpeta de spam o correo no deseado.",
                "Confirma en <strong>Usuarios</strong> que su dirección esté bien escrita.",
              ]}
            />
            <Subsection
              title="Un usuario nuevo no puede iniciar sesión"
              steps={[
                "Confirma que el administrador ya lo haya creado en <strong>Usuarios</strong> con su rol correspondiente.",
                "Verifica que esté usando el correo exacto con el que fue dado de alta.",
                "Si olvidó su contraseña, puede recuperarla desde el enlace de la pantalla de inicio de sesión.",
              ]}
            />
          </Section>
        </div>

        {/* Más lectura */}
        <div className="rounded-xl border p-6 space-y-2">
          <p className="font-semibold">¿Buscas algo más de fondo?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este manual cubre el uso de la plataforma. Si lo que necesitas es decidir cómo
            organizar el control de accesos de tu condominio —qué datos puedes pedirle a una
            visita, cómo tratar a proveedores y delivery, o cómo presentar la propuesta a la
            junta de propietarios— eso está en las{" "}
            <Link href="/guias" className="text-primary hover:underline font-medium">
              guías de control de accesos
            </Link>
            .
          </p>
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
