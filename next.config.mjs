import { withSentryConfig } from "@sentry/nextjs"

// Dominios de Google AdSense para el espacio publicitario del plan gratuito.
// Se añaden al CSP solo cuando hay cuenta configurada.
const ADSENSE_HOSTS = [
  "https://pagead2.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://www.googletagservices.com",
  "https://adservice.google.com",
  // CMP de Google (banner de consentimiento para EEE, Reino Unido y Suiza).
  // Sin estos dominios el banner queda bloqueado por el CSP y no aparece.
  "https://fundingchoicesmessages.google.com",
  "https://*.fundingchoicesmessages.google.com",
].join(" ")

const ADS = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? ` ${ADSENSE_HOSTS}` : ""
// Los creativos se sirven desde varios CDN de Google.
const ADS_IMG = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  ? ` ${ADSENSE_HOSTS} https://www.google.com https://www.gstatic.com https://*.googleusercontent.com`
  : ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Habilita instrumentation.ts (carga la config de Sentry según runtime).
  experimental: { instrumentationHook: true },
  // La landing estática /landing fue eliminada; redirige a la home unificada.
  async redirects() {
    return [{ source: "/landing", destination: "/", permanent: true }]
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            // camera=(self) habilita el escáner QR del vigilante (mismo origen).
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            // Los dominios de AdSense solo se whitelistean si hay cuenta
            // configurada: sin NEXT_PUBLIC_ADSENSE_CLIENT el CSP se queda tan
            // estricto como estaba y no se abre nada "por si acaso".
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.culqi.com${ADS}`,
              "style-src 'self' 'unsafe-inline' https://checkout.culqi.com",
              `img-src 'self' data: blob: https://checkout.culqi.com${ADS_IMG}`,
              "font-src 'self' https://checkout.culqi.com",
              `connect-src 'self' https://api.culqi.com https://checkout.culqi.com https://*.sentry.io${ADS}`,
              `frame-src https://checkout.culqi.com${ADS}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

// Solo envolvemos con Sentry si hay DSN configurado. Sin DSN, el build queda
// idéntico al actual (el plugin de Sentry ni siquiera se ejecuta).
const sentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
)

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN, // opcional: para subir source maps
      widenClientFileUpload: true,
    })
  : nextConfig
