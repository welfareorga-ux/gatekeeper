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
