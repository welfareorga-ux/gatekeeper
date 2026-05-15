import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Gatekeeper <onboarding@resend.dev>"

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
