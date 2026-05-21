import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Gatekeeper <noreply@gatekeeper-app.org>"

function formatHora(date: Date) {
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Lima",
  })
}

function formatFecha(date: Date) {
  return date.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Lima",
  })
}

export async function enviarNotificacionIngreso({
  emailResidente,
  nombreResidente,
  nombreVisitante,
  placa,
  condominioNombre,
  horaIngreso,
}: {
  emailResidente: string
  nombreResidente: string
  nombreVisitante: string
  placa: string
  condominioNombre: string
  horaIngreso: Date
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: emailResidente,
      subject: `🚗 ${nombreVisitante} ingresó a ${condominioNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Ingreso registrado</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hola <strong>${nombreResidente}</strong>, tu visita acaba de ingresar al condominio.</p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Visitante</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${nombreVisitante}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Vehículo</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;font-family:monospace">${placa}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Hora de ingreso</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${formatHora(horaIngreso)} — ${formatFecha(horaIngreso)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Condominio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${condominioNombre}</td></tr>
            </table>
          </div>

          <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 16px">
            <p style="color:#065f46;font-size:13px;margin:0">✅ El ingreso fue verificado y registrado por el vigilante de turno.</p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">Este es un mensaje automático de Gatekeeper — no responder.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar notificación de ingreso:", err)
  }
}

export async function enviarNotificacionSalida({
  emailResidente,
  nombreResidente,
  nombreVisitante,
  placa,
  condominioNombre,
  horaIngreso,
  horaSalida,
}: {
  emailResidente: string
  nombreResidente: string
  nombreVisitante: string
  placa: string
  condominioNombre: string
  horaIngreso: Date
  horaSalida: Date
}) {
  const minutos = Math.round((horaSalida.getTime() - horaIngreso.getTime()) / 60000)
  const duracion = minutos < 60
    ? `${minutos} min`
    : `${Math.floor(minutos / 60)}h ${minutos % 60}min`

  try {
    await resend.emails.send({
      from: FROM,
      to: emailResidente,
      subject: `👋 ${nombreVisitante} salió de ${condominioNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Salida registrada</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Hola <strong>${nombreResidente}</strong>, tu visita ha salido del condominio.</p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Visitante</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${nombreVisitante}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Vehículo</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;font-family:monospace">${placa}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Ingresó</td><td style="padding:8px 0;font-size:14px;color:#111827">${formatHora(horaIngreso)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Salió</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${formatHora(horaSalida)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Permanencia</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${duracion}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Condominio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${condominioNombre}</td></tr>
            </table>
          </div>

          <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:14px 16px">
            <p style="color:#1e40af;font-size:13px;margin:0">📋 La salida fue registrada por el vigilante de turno.</p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">Este es un mensaje automático de Gatekeeper — no responder.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar notificación de salida:", err)
  }
}

export async function enviarEmailRecuperarContrasena({
  email,
  nombre,
  resetUrl,
}: {
  email: string
  nombre: string
  resetUrl: string
}) {
  // No atrapar el error — dejar que suba para que aparezca en los logs de Vercel
  await resend.emails.send({
      from: FROM,
      to: email,
      subject: `🔑 Recuperar contraseña — Gatekeeper`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Recuperar contraseña</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
          </p>

          <a href="${resetUrl}"
             style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:24px">
            Restablecer contraseña
          </a>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="color:#6b7280;font-size:13px;margin:0 0 4px">O copia este enlace en tu navegador:</p>
            <p style="color:#111827;font-size:12px;word-break:break-all;font-family:monospace;margin:0">${resetUrl}</p>
          </div>

          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 16px">
            <p style="color:#92400e;font-size:13px;margin:0">⏰ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.</p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">Este es un mensaje automático de Gatekeeper — no responder.</p>
        </div>
      `,
  })
}

export async function enviarEmailBienvenida({
  email,
  nombre,
  condominioNombre,
  planLabel,
  loginUrl,
}: {
  email: string
  nombre: string
  condominioNombre: string
  planLabel: string
  loginUrl: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `¡Bienvenido a Gatekeeper! Tu cuenta está lista`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso vehicular</p>
          </div>

          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">¡Bienvenido, ${nombre}!</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Tu suscripción fue activada correctamente. Ya puedes acceder a tu panel de administración.
          </p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Condominio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${condominioNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Plan</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${planLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email de acceso</td><td style="padding:8px 0;font-size:14px;color:#111827">${email}</td></tr>
            </table>
          </div>

          <a href="${loginUrl}"
             style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:24px">
            Acceder al panel →
          </a>

          <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 16px;margin-bottom:16px">
            <p style="color:#065f46;font-size:13px;margin:0">
              ✅ Tu primer paso: agregar residentes y vigilantes desde <strong>Usuarios</strong> en el panel.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">
            ¿Necesitas ayuda? Escríbenos a soporte@gatekeeper-app.org
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar email de bienvenida:", err)
  }
}

export async function enviarEmailTrialBienvenida({
  email,
  nombre,
  condominioNombre,
  trialEndsAt,
  loginUrl,
}: {
  email: string
  nombre: string
  condominioNombre: string
  trialEndsAt: Date
  loginUrl: string
}) {
  const fechaFin = trialEndsAt.toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima",
  })
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `¡Bienvenido a Gatekeeper! Tu prueba gratuita de 14 días ha comenzado`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso vehicular</p>
          </div>

          <h2 style="color:#111827;font-size:20px;margin:0 0 8px">¡Bienvenido, ${nombre}!</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Tu prueba gratuita de <strong>14 días</strong> ha comenzado. Explora todas las funciones del panel de administración sin costo.
          </p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Condominio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${condominioNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Acceso</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#059669">14 días gratis · Sin tarjeta</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Vence el</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${fechaFin}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email de acceso</td><td style="padding:8px 0;font-size:14px;color:#111827">${email}</td></tr>
            </table>
          </div>

          <a href="${loginUrl}"
             style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:24px">
            Acceder al panel →
          </a>

          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-bottom:16px">
            <p style="color:#92400e;font-size:13px;margin:0">
              ⏰ Antes de que termine tu prueba, elige un plan desde <strong>Mi suscripción</strong> en el panel para continuar sin interrupciones.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">
            ¿Necesitas ayuda? Escríbenos a soporte@gatekeeper-app.org
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar email de trial:", err)
  }
}

export async function enviarNotificacionServicioContratado({
  nombre,
  email,
  servicioNombre,
  precio,
  condominioNombre,
}: {
  nombre: string
  email: string
  servicioNombre: string
  precio: string
  condominioNombre: string
}) {
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima",
  })
  try {
    await resend.emails.send({
      from: FROM,
      to: "welfareorga@gmail.com",
      subject: `💼 Nuevo servicio contratado: ${servicioNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Notificación interna</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Nuevo servicio contratado</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Un cliente ha contratado un servicio adicional de Gatekeeper.
          </p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Servicio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${servicioNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Monto cobrado</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#059669">${precio}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Cliente</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${nombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px;color:#111827">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Condominio</td><td style="padding:8px 0;font-size:14px;color:#111827">${condominioNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Fecha</td><td style="padding:8px 0;font-size:14px;color:#111827">${fecha}</td></tr>
            </table>
          </div>

          <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 16px">
            <p style="color:#065f46;font-size:13px;margin:0">✅ El pago fue procesado exitosamente por Culqi. Coordina la sesión de implementación con el cliente.</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar notificación de servicio contratado:", err)
  }
}

export async function enviarManualUso({
  email,
  nombre,
  condominioNombre,
  loginUrl,
}: {
  email: string
  nombre: string
  condominioNombre: string
  loginUrl: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `📋 Manual de uso de Gatekeeper — ${condominioNombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Manual de uso — ${condominioNombre}</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 6px">Hola, ${nombre}</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Aquí tienes el manual básico de Gatekeeper para que tú y tu equipo comiencen a usar la plataforma de inmediato.
          </p>

          <!-- ADMINISTRADOR -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <h3 style="color:#111827;font-size:15px;margin:0 0 12px;border-bottom:1px solid #f3f4f6;padding-bottom:8px">
              🏢 Guía del Administrador
            </h3>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:12px 0 6px">Agregar residentes y vigilantes</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Accede al panel → <strong>Usuarios</strong> en el menú lateral.</li>
              <li>Haz clic en <strong>"Nuevo usuario"</strong>.</li>
              <li>Ingresa nombre, email y asigna el rol (RESIDENTE o VIGILANTE).</li>
              <li>Copia y comparte las credenciales con cada usuario.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Reportes y exportación</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Ve a <strong>Reportes</strong>: visitas por día, por residente, vehículos frecuentes.</li>
              <li>Exporta a <strong>Excel o PDF</strong> con un clic.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Auditoría y alertas</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li><strong>Auditoría</strong>: historial completo de acciones de todos los usuarios.</li>
              <li><strong>Alertas</strong>: marca vehículos o personas que requieran seguimiento especial.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Gestión de suscripción</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Ve a <strong>Suscripción</strong> para cambiar de plan o cancelar.</li>
            </ol>
          </div>

          <!-- VIGILANTE -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <h3 style="color:#111827;font-size:15px;margin:0 0 12px;border-bottom:1px solid #f3f4f6;padding-bottom:8px">
              👮 Guía del Vigilante
            </h3>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:12px 0 6px">Iniciar turno</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Inicia sesión en <strong>gatekeeper-app.org</strong>.</li>
              <li>Pulsa <strong>"Iniciar turno"</strong> para activar el registro de accesos.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Registrar ingreso</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Escribe la placa en el buscador (funciona en celular).</li>
              <li>Confirma los datos del visitante y del residente.</li>
              <li>Pulsa <strong>"Registrar ingreso"</strong>. El residente recibe una notificación automática.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Registrar salida</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Ve a <strong>"Dentro"</strong>.</li>
              <li>Busca el vehículo y pulsa <strong>"Registrar salida"</strong>.</li>
            </ol>
          </div>

          <!-- RESIDENTE -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
            <h3 style="color:#111827;font-size:15px;margin:0 0 12px;border-bottom:1px solid #f3f4f6;padding-bottom:8px">
              🏠 Guía del Residente
            </h3>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:12px 0 6px">Registrar una visita</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>Ve a <strong>Nueva Visita</strong>.</li>
              <li>Ingresa nombre del visitante, placa y fecha/hora esperada.</li>
              <li>Comparte el <strong>código QR</strong> generado por WhatsApp o email.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Plantillas de visitas frecuentes</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>En <strong>Plantillas</strong>, guarda datos de visitantes recurrentes.</li>
              <li>Úsalas para crear nuevas visitas en segundos.</li>
            </ol>

            <p style="color:#374151;font-size:13px;font-weight:600;margin:14px 0 6px">Historial</p>
            <ol style="color:#6b7280;font-size:13px;margin:0;padding-left:20px;line-height:1.8">
              <li>En <strong>Historial</strong>, revisa todas las visitas pasadas con horarios de ingreso y salida.</li>
            </ol>
          </div>

          <a href="${loginUrl}"
             style="display:inline-block;background:#111827;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:24px">
            Ir al panel →
          </a>

          <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:14px 16px;margin-bottom:16px">
            <p style="color:#1e40af;font-size:13px;margin:0">
              💡 <strong>Tip inicial:</strong> Lo primero es crear tus vigilantes y residentes desde
              <strong>Usuarios</strong> en el panel de administración.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">
            ¿Necesitas ayuda? Escríbenos a soporte@gatekeeper-app.org o al +51 964 462 645.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar manual de uso:", err)
  }
}

export async function enviarEmailCobroFallido({
  emailAdmin,
  nombreAdmin,
  condominioNombre,
  planLabel,
}: {
  emailAdmin: string
  nombreAdmin: string
  condominioNombre: string
  planLabel: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: emailAdmin,
      subject: `⚠️ Problema con tu pago — Gatekeeper`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Sistema de control de acceso</p>
          </div>

          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-bottom:24px">
            <p style="color:#92400e;font-size:14px;margin:0;font-weight:600">⚠️ No pudimos procesar tu pago</p>
          </div>

          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">Acción requerida</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            Hola <strong>${nombreAdmin}</strong>, el cobro mensual de tu suscripción a Gatekeeper no pudo ser procesado.
            El acceso al panel de <strong>${condominioNombre}</strong> ha sido suspendido temporalmente.
          </p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">Condominio</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${condominioNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Plan</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827">${planLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Estado</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#dc2626">Pago fallido</td></tr>
            </table>
          </div>

          <p style="color:#6b7280;font-size:14px;margin:0 0 16px">
            Para reactivar tu acceso, actualiza tu método de pago o contáctanos:
          </p>

          <a href="mailto:soporte@gatekeeper-app.org?subject=Reactivar suscripción — ${condominioNombre}"
             style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            Contactar soporte
          </a>

          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">
            Este es un mensaje automático de Gatekeeper — soporte@gatekeeper-app.org
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[email] Error al enviar email de cobro fallido:", err)
  }
}
