import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

// Endpoint TEMPORAL para verificar que Sentry reporta en producción.
// Se elimina tras confirmar el primer evento en el dashboard.
export const dynamic = "force-dynamic"

export async function GET() {
  const error = new Error(
    "Sentry test error — verificación manual (este endpoint se borra después)"
  )
  // Captura explícita (garantiza el envío) + flush antes de responder.
  Sentry.captureException(error)
  await Sentry.flush(2000)

  return NextResponse.json(
    { ok: false, mensaje: "Error de prueba enviado a Sentry. Revisa Issues." },
    { status: 500 }
  )
}
