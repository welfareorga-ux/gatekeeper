"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { Loader2, CameraOff } from "lucide-react"

interface QrScannerProps {
  /** Se llama una sola vez con el texto decodificado del QR. La cámara se detiene antes. */
  onScan: (texto: string) => void
}

const READER_ID = "gk-qr-reader"

export function QrScanner({ onScan }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const yaEscaneadoRef = useRef(false)
  const [estado, setEstado] = useState<"cargando" | "activo" | "error">("cargando")

  useEffect(() => {
    let cancelado = false
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    scannerRef.current = scanner

    async function detener() {
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) await scanner.stop()
        scanner.clear()
      } catch { /* ya estaba detenido */ }
    }

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (texto) => {
          if (yaEscaneadoRef.current) return
          yaEscaneadoRef.current = true
          void detener().then(() => onScan(texto.trim()))
        },
        () => { /* error por frame sin QR: se ignora */ }
      )
      .then(() => { if (!cancelado) setEstado("activo") })
      .catch(() => { if (!cancelado) setEstado("error") })

    return () => {
      cancelado = true
      void detener()
    }
    // onScan es estable (definido en el padre); no lo incluimos para no reiniciar la cámara.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full space-y-3">
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-border bg-black">
        <div id={READER_ID} className="w-full [&_video]:w-full [&_video]:rounded-2xl" />

        {estado === "cargando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Iniciando cámara…</p>
          </div>
        )}

        {estado === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-6 text-center text-white">
            <CameraOff className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">No se pudo acceder a la cámara</p>
            <p className="text-xs text-white/70">
              Da permiso de cámara al navegador o usa el ingreso manual del código de abajo.
            </p>
          </div>
        )}
      </div>

      {estado === "activo" && (
        <p className="text-center text-xs text-muted-foreground">
          Apunta al código QR de la visita
        </p>
      )}
    </div>
  )
}
