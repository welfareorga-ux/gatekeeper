// Configuración de Sentry para el runtime de Node (servidor).
// No hace NADA si no está definido SENTRY_DSN (o NEXT_PUBLIC_SENTRY_DSN):
// queda como no-op hasta que crees una cuenta y pegues el DSN.
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    // Muestreo de trazas de performance (ajústalo según volumen/cuota).
    tracesSampleRate: 0.1,
    // Solo reporta en producción para no ensuciar con errores de desarrollo.
    enabled: process.env.NODE_ENV === "production",
  })
}
