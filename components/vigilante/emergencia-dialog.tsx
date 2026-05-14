"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
  placaInicial?: string
  onConfirmado: () => void
}

export function EmergenciaDialog({ open, onClose, placaInicial = "", onConfirmado }: Props) {
  const [placa, setPlaca] = useState(placaInicial)
  const [nombreVisitante, setNombreVisitante] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!placa.trim()) {
      toast.error("Ingresa la placa del vehículo")
      return
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/emergencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa: placa.toUpperCase(), nombreVisitante, descripcion }),
      })

      if (!res.ok) {
        toast.error("Error al registrar emergencia")
        return
      }

      onConfirmado()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="dark bg-background text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Registro manual de emergencia
          </DialogTitle>
          <DialogDescription>
            Usa esto solo cuando el vehículo no tiene pre-registro y el residente autorizó verbalmente.
            Se notificará al administrador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Placa del vehículo *</Label>
            <Input
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="A1B-234"
              className="font-mono text-lg h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del visitante</Label>
            <Input
              value={nombreVisitante}
              onChange={(e) => setNombreVisitante(e.target.value)}
              placeholder="Nombre del visitante (si conoce)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción / motivo</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe la situación de emergencia..."
              rows={3}
              maxLength={500}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={enviando} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={enviar}
            disabled={enviando || !placa.trim()}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
          >
            {enviando ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</>
            ) : (
              <><AlertTriangle className="h-4 w-4 mr-2" /> Registrar emergencia</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
