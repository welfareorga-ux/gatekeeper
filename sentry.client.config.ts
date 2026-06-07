// Configuración de Sentry en el navegador (cliente).
// Usa NEXT_PUBLIC_SENTRY_DSN (debe ser pública para que el cliente la lea).
// No-op si no está definida.
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Session Replay desactivado por defecto (consume cuota); súbelo si lo quieres.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enabled: process.env.NODE_ENV === "production",
  })
}
