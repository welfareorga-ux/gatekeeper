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

    // Ruido de extensiones del navegador y bots (no son bugs de la app).
    // Ej: "Cannot read properties of undefined (reading 'getReader')"
    // proviene de scripts inyectados por extensiones del visitante, no de
    // nuestro código (la app no usa streaming/getReader en ningún sitio).
    ignoreErrors: [
      "Cannot read properties of undefined (reading 'getReader')",
      // Errores genéricos que suelen originarse fuera de la app.
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
    ],
    denyUrls: [
      // Extensiones del navegador (Chrome/Firefox/Safari).
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
      /extensions\//i,
      // Scripts anónimos inyectados (sin archivo real de origen).
      /^<anonymous>$/,
    ],
  })
}
