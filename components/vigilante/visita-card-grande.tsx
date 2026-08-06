"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EstadoBadge } from "@/components/visitas/estado-badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  LogIn, LogOut, Loader2, MapPin, User, Car, Clock, FileText, CheckCircle2
} from "lucide-react"
import { formatFechaHora } from "@/lib/utils"
import type { EstadoVisita } from "@prisma/client"

type Vehiculo = { id: string; placa: string | null; marca?: string; modelo?: string; color?: string }
type Visita = {
  id: string; codigoQR: string; estado: EstadoVisita
  nombreVisitante: string; dniVisitante: string; motivoVisita: string
  horaInicio: string; horaFin: string
  vehiculos: Vehiculo[]
  residente: { nombre: string; direccion?: string }
  registros: Array<{ id: string; fechaHoraIngreso: string }>
}

interface Props {
  visita: Visita
  onAccionCompletada: () => void
}

export function VisitaCardGrande({ visita, onAccionCompletada }: Props) {
  const [procesando, setProcesando] = useState(false)
  const [notas, setNotas] = useState("")
  const [mostrarNotas, setMostrarNotas] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  const esPendiente = visita.estado === "PENDIENTE"
  const esIngresado = visita.estado === "INGRESADO"
  const esAccionable = esPendiente || esIngresado
  const vehiculoPrincipal = visita.vehiculos[0]

  const colorHeader = esPendiente
    ? "bg-green-900/40 border-green-600"
    : esIngresado
    ? "bg-orange-900/40 border-orange-600"
    : "bg-muted/30 border-border"

  async function ejecutarAccion() {
    setProcesando(true)
    try {
      let res: Response

      if (esPendiente) {
        res = await fetch("/api/registros/ingreso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitaId: visita.id,
            vehiculoId: vehiculoPrincipal?.id,
            notasVigilante: notas || undefined,
          }),
        })
      } else {
        res = await fetch("/api/registros/salida", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitaId: visita.id,
            notasVigilante: notas || undefined,
          }),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al registrar")
        return
      }

      setConfirmado(true)
      setTimeout(() => onAccionCompletada(), 1800)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setProcesando(false)
    }
  }

  if (confirmado) {
    return (
      <div className="rounded-2xl border-2 border-green-600 bg-green-900/30 p-8 text-center space-y-3">
        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
        <p className="text-2xl font-bold text-green-400">
          {esPendiente ? "¡Ingreso registrado!" : "¡Salida registrada!"}
        </p>
        <p className="text-muted-foreground">Volviendo al buscador...</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border-2 ${colorHeader} overflow-hidden`}>
      {/* Header con estado */}
      <div className={`px-6 py-4 ${esPendiente ? "bg-green-900/30" : esIngresado ? "bg-orange-900/30" : "bg-muted/20"}`}>
        <div className="flex items-center justify-between">
          <EstadoBadge estado={visita.estado} />
          <Badge variant="outline" className="font-mono text-xs">
            {visita.codigoQR.slice(0, 8).toUpperCase()}
          </Badge>
        </div>

        {/* Dirección del residente — tipografía GRANDE */}
        <p className="text-2xl sm:text-3xl font-bold mt-3 leading-tight">
          {visita.residente.direccion ?? "Sin dirección"}
        </p>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Autorizado por: {visita.residente.nombre}
        </p>
      </div>

      {/* Cuerpo */}
      <div className="px-6 py-5 space-y-5">
        {/* Visitante */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
              <User className="h-3 w-3" /> Visitante
            </p>
            <p className="font-semibold text-lg leading-tight">{visita.nombreVisitante}</p>
            <p className="text-muted-foreground text-sm">DNI: {visita.dniVisitante}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
              <FileText className="h-3 w-3" /> Motivo
            </p>
            <p className="font-medium">{visita.motivoVisita}</p>
          </div>
        </div>

        <Separator />

        {/* Vehículos */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
            <Car className="h-3 w-3" /> Vehículo(s)
          </p>
          {visita.vehiculos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin vehículo registrado</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visita.vehiculos.map((v) => (
                <div key={v.id} className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="font-mono font-bold text-lg">{v.placa ?? "Sin placa"}</span>
                  {(v.marca || v.modelo || v.color) && (
                    <span className="text-sm text-muted-foreground">
                      {[v.marca, v.modelo, v.color].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Horario */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Horario:</span>
            <span className="font-medium">
              {new Date(visita.horaInicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
              {" – "}
              {new Date(visita.horaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>
          {esIngresado && visita.registros[0] && (
            <div className="flex items-center gap-1.5">
              <LogIn className="h-4 w-4 text-orange-400" />
              <span className="text-muted-foreground">Ingresó:</span>
              <span className="font-medium text-orange-400">
                {new Date(visita.registros[0].fechaHoraIngreso).toLocaleTimeString("es-PE", {
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Notas opcionales */}
        {mostrarNotas && (
          <div className="space-y-1.5">
            <Label className="text-sm">Notas del vigilante (opcional)</Label>
            <Textarea
              placeholder="Observaciones adicionales..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              maxLength={500}
              className="resize-none"
            />
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => setMostrarNotas(!mostrarNotas)}
          >
            {mostrarNotas ? "Ocultar notas" : "Agregar notas"}
          </button>
        </div>

        {/* Botón de acción GIGANTE */}
        {esAccionable ? (
          <Button
            onClick={ejecutarAccion}
            disabled={procesando}
            className={`
              w-full h-[70px] text-xl font-bold rounded-2xl shadow-xl
              ${esPendiente
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
              }
            `}
          >
            {procesando ? (
              <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> Procesando...</>
            ) : esPendiente ? (
              <><LogIn className="h-6 w-6 mr-3" /> REGISTRAR INGRESO</>
            ) : (
              <><LogOut className="h-6 w-6 mr-3" /> REGISTRAR SALIDA</>
            )}
          </Button>
        ) : (
          <div className="w-full h-[60px] rounded-2xl bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground font-medium">
              Visita en estado {visita.estado} — no se puede registrar acción
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
