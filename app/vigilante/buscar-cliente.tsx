"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { normalizarPlacaInput, validarPlaca } from "@/lib/validations/placa"
import { Button } from "@/components/ui/button"
import { VisitaCardGrande } from "@/components/vigilante/visita-card-grande"
import { EmergenciaDialog } from "@/components/vigilante/emergencia-dialog"
import { Loader2, Search, AlertCircle, Car } from "lucide-react"
import type { EstadoVisita } from "@prisma/client"

type VehiculoResult = { id: string; placa: string; marca?: string; modelo?: string; color?: string }
type VisitaResult = {
  id: string; codigoQR: string; estado: EstadoVisita
  nombreVisitante: string; dniVisitante: string; motivoVisita: string
  horaInicio: string; horaFin: string
  vehiculos: VehiculoResult[]
  residente: { id: string; nombre: string; direccion?: string; telefono?: string }
  registros: Array<{ id: string; fechaHoraIngreso: string }>
}

export function BuscarCliente() {
  const [placa, setPlaca] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<{
    encontrado: boolean; visitas?: VisitaResult[]; mensaje?: string
  } | null>(null)
  const [placaBuscada, setPlacaBuscada] = useState("")
  const [emergenciaOpen, setEmergenciaOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Feedback sensorial ──────────────────────────────────────────────────────
  function vibrar(exito: boolean) {
    if ("vibrate" in navigator) {
      navigator.vibrate(exito ? [100, 50, 100] : [300])
    }
  }

  function beep(exito: boolean) {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = exito ? 880 : 330
      osc.type = "sine"
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch { /* sin audio */ }
  }

  // ─── Búsqueda ────────────────────────────────────────────────────────────────
  const buscar = useCallback(async (placaValor?: string) => {
    const p = (placaValor ?? placa).trim()
    if (!p) return

    setBuscando(true)
    setResultado(null)

    try {
      const res = await fetch(`/api/visitas/placa/${encodeURIComponent(p)}`)

      if (res.status === 429) {
        toast.error("Demasiadas búsquedas. Espera un momento.")
        return
      }
      if (!res.ok) {
        toast.error("Error al buscar. Intenta de nuevo.")
        return
      }

      const data = await res.json()
      setResultado(data)
      setPlacaBuscada(p)

      if (data.encontrado) {
        vibrar(true)
        beep(true)
      } else {
        vibrar(false)
        beep(false)
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBuscando(false)
    }
  }, [placa])

  function handlePlacaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, "")
    const formateada = normalizarPlacaInput(raw)
    setPlaca(formateada)
    setResultado(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && placa.trim()) buscar()
  }

  function limpiar() {
    setPlaca("")
    setResultado(null)
    setPlacaBuscada("")
    inputRef.current?.focus()
  }

  function onAccionCompletada() {
    toast.success("Operación registrada exitosamente")
    vibrar(true)
    beep(true)
    limpiar()
  }

  const placaEsValida = validarPlaca(placa) || /^\d{3}$/.test(placa)

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-8 max-w-2xl mx-auto w-full">
      {/* ─── Input gigante ─────────────────────────────────────────────────── */}
      <div className="w-full space-y-4">
        <p className="text-center text-muted-foreground text-sm tracking-widest uppercase">
          Ingresa la placa del vehículo
        </p>

        <input
          ref={inputRef}
          type="text"
          value={placa}
          onChange={handlePlacaChange}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          placeholder="A1B-234"
          aria-label="Placa del vehículo"
          className={`
            w-full rounded-2xl border-2 bg-card text-center font-mono font-bold
            tracking-widest outline-none transition-all
            text-[clamp(2rem,8vw,3.5rem)] h-[80px] sm:h-[100px]
            placeholder:text-muted-foreground/30
            focus:ring-4
            ${placa && !placaEsValida
              ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive/20"
              : placa && placaEsValida
              ? "border-green-500 text-green-400 focus:border-green-500 focus:ring-green-500/20"
              : "border-border focus:border-primary focus:ring-primary/20"
            }
          `}
        />

        {/* Hint últimos 3 dígitos */}
        <p className="text-center text-xs text-muted-foreground">
          Puedes buscar por placa completa o solo los{" "}
          <span className="text-foreground font-medium">últimos 3 dígitos</span>
        </p>

        {/* Botón BUSCAR */}
        <Button
          onClick={() => buscar()}
          disabled={!placa.trim() || buscando}
          size="2xl"
          className="w-full h-[70px] text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg"
        >
          {buscando ? (
            <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> Buscando...</>
          ) : (
            <><Search className="h-6 w-6 mr-3" /> BUSCAR</>
          )}
        </Button>
      </div>

      {/* ─── Resultado ─────────────────────────────────────────────────────── */}
      {resultado !== null && (
        <div className="w-full">
          {resultado.encontrado && resultado.visitas ? (
            <div className="space-y-4">
              {resultado.visitas.map((visita) => (
                <VisitaCardGrande
                  key={visita.id}
                  visita={visita}
                  onAccionCompletada={onAccionCompletada}
                />
              ))}
            </div>
          ) : (
            /* No encontrado */
            <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                  <Car className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-destructive">Placa no registrada</p>
                <p className="text-muted-foreground text-sm mt-1">
                  <span className="font-mono font-bold">{placaBuscada}</span> no tiene visita activa o pendiente
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                onClick={() => setEmergenciaOpen(true)}
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Registro manual de emergencia
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Diálogo emergencia ─────────────────────────────────────────────── */}
      <EmergenciaDialog
        open={emergenciaOpen}
        onClose={() => setEmergenciaOpen(false)}
        placaInicial={placaBuscada}
        onConfirmado={() => {
          setEmergenciaOpen(false)
          toast.warning("Registro de emergencia enviado al administrador")
          limpiar()
        }}
      />
    </div>
  )
}
