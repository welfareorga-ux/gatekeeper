// Hook de instrumentación de Next.js: carga la config de Sentry según el runtime.
// Las propias configs son no-op si no hay DSN, así que esto es inofensivo sin cuenta.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}
