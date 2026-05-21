import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const data = await req.json()
    const { nombres, dni, email, telefono, direccion, servicio, monto, tipo, descripcion, pedido } = data

    if (!nombres || !dni || !email || !tipo || !descripcion || !pedido || !servicio) {
      return NextResponse.json({ error: "Campos obligatorios incompletos" }, { status: 400 })
    }

    const nroReclamo = `GK-${Date.now().toString(36).toUpperCase()}`
    const fecha = new Date().toLocaleDateString("es-PE", {
      day: "numeric", month: "long", year: "numeric",
      timeZone: "America/Lima",
    })

    await resend.emails.send({
      from: "Gatekeeper <noreply@gatekeeper-app.org>",
      to: "soporte@gatekeeper-app.org",
      replyTo: email,
      subject: `📋 ${tipo} ${nroReclamo} — ${nombres}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper — Libro de Reclamaciones</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">${tipo} registrado el ${fecha}</p>
          </div>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <h2 style="font-size:15px;color:#111827;margin:0 0 12px">Nº de reclamo: <span style="font-family:monospace;color:#6366f1">${nroReclamo}</span></h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:6px 0;color:#6b7280;width:35%">Nombre</td><td style="padding:6px 0;font-weight:600;color:#111827">${nombres}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">DNI / CE</td><td style="padding:6px 0;color:#111827">${dni}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Correo</td><td style="padding:6px 0;color:#111827">${email}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Teléfono</td><td style="padding:6px 0;color:#111827">${telefono || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Dirección</td><td style="padding:6px 0;color:#111827">${direccion || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Servicio</td><td style="padding:6px 0;color:#111827">${servicio}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Monto</td><td style="padding:6px 0;color:#111827">${monto ? `S/ ${monto}` : "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Tipo</td><td style="padding:6px 0;font-weight:600;color:${tipo === "RECLAMO" ? "#dc2626" : "#d97706"}">${tipo}</td></tr>
            </table>
          </div>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px">Descripción:</p>
            <p style="font-size:13px;color:#374151;margin:0;white-space:pre-wrap">${descripcion}</p>
          </div>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px">
            <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px">Solución solicitada:</p>
            <p style="font-size:13px;color:#374151;margin:0;white-space:pre-wrap">${pedido}</p>
          </div>

          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 16px">
            <p style="color:#92400e;font-size:13px;margin:0">⚠️ Debes responder este reclamo en un plazo máximo de 15 días hábiles conforme a Ley N° 29571.</p>
          </div>
        </div>
      `,
    })

    // Confirmación al reclamante
    await resend.emails.send({
      from: "Gatekeeper <noreply@gatekeeper-app.org>",
      to: email,
      subject: `Confirmación de ${tipo.toLowerCase()} — Nº ${nroReclamo}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px">
          <div style="background:#111827;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h1 style="color:#fff;font-size:20px;margin:0">🛡️ Gatekeeper</h1>
            <p style="color:#9ca3af;font-size:13px;margin:4px 0 0">Libro de Reclamaciones</p>
          </div>
          <h2 style="color:#111827;font-size:18px;margin:0 0 8px">${tipo} registrado</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 16px">Hola <strong>${nombres}</strong>, hemos recibido tu ${tipo.toLowerCase()} correctamente.</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Número de reclamo</p>
            <p style="font-size:20px;font-family:monospace;font-weight:700;color:#111827;margin:0">${nroReclamo}</p>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 16px">
            Responderemos a tu ${tipo.toLowerCase()} en un plazo máximo de <strong>15 días hábiles</strong>.
            Puedes comunicarte con nosotros en:
          </p>
          <ul style="font-size:13px;color:#6b7280;padding-left:20px">
            <li>WhatsApp: +51 964 462 645</li>
            <li>Email: soporte@gatekeeper-app.org</li>
          </ul>
          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;text-align:center">Gatekeeper — Josue Antonio Medina Bocanegra, RUC 10460632027</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, nroReclamo })
  } catch (err) {
    console.error("[reclamaciones]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
