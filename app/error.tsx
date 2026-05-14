"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Gatekeeper Error]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center text-center px-4 space-y-6 max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado. Si el problema persiste, contacta al administrador.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono">
              Código: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
