"use client"

// Captura errores que ocurren en el root layout (no cubiertos por app/error.tsx).
// Reporta a Sentry (no-op si no hay DSN) y muestra un fallback mínimo.
import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Gatekeeper GlobalError]", error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Algo salió mal</h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: "24rem" }}>
          Ocurrió un error inesperado. Si el problema persiste, contacta al administrador.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
