"use client"

import QRCode from "react-qr-code"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Share2, CheckCircle2 } from "lucide-react"
import { formatFechaHora } from "@/lib/utils"

interface VisitaQrDialogProps {
  open: boolean
  onClose: () => void
  visita: {
    codigoQR: string
    nombreVisitante: string
    horaInicio: string
    horaFin: string
    vehiculos: Array<{ placa: string; marca?: string; color?: string }>
  }
  residenteNombre?: string
  residenteDireccion?: string
}

export function VisitaQrDialog({
  open, onClose, visita, residenteNombre, residenteDireccion,
}: VisitaQrDialogProps) {
  function compartirWhatsApp() {
    const placas = visita.vehiculos.map((v) => v.placa).join(", ")
    const texto = [
      "🏠 *Visita autorizada — Gatekeeper*",
      "",
      ...(residenteNombre ? [`👤 Residente: ${residenteNombre}`] : []),
      ...(residenteDireccion ? [`📍 Dirección: ${residenteDireccion}`] : []),
      "",
      `🙋 Visitante: ${visita.nombreVisitante}`,
      `🚗 Vehículo(s): ${placas}`,
      `🕐 Ingreso: ${formatFechaHora(visita.horaInicio)}`,
      `🕐 Salida est.: ${formatFechaHora(visita.horaFin)}`,
      "",
      `🔑 Código de visita: ${visita.codigoQR}`,
      "",
      "_Presenta este mensaje o código QR al vigilante de portería._",
    ].join("\n")

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Visita registrada
          </DialogTitle>
          <DialogDescription>
            Comparte este código QR con tu visitante para agilizar el ingreso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl border">
            <QRCode value={visita.codigoQR} size={180} />
          </div>

          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            {visita.codigoQR}
          </p>

          <Separator />

          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visitante:</span>
              <span className="font-medium">{visita.nombreVisitante}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingreso:</span>
              <span>{formatFechaHora(visita.horaInicio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salida est.:</span>
              <span>{formatFechaHora(visita.horaFin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vehículo(s):</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {visita.vehiculos.map((v) => (
                  <Badge key={v.placa} variant="outline" className="font-mono text-xs">
                    {v.placa}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button onClick={compartirWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
