"use client"

import { useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { normalizarPlacaInput, validarPlaca } from "@/lib/validations/placa"
import { Button } from "@/components/ui/button"
import { VisitaCardGrande } from "@/components/vigilante/visita-card-grande"
import { EmergenciaDialog } from "@/components/vigilante/emergencia-dialog"
import { Loader2, Search, AlertCircle, Car, User, QrCode } from "lucide-react"
import type { EstadoVisita } from "@prisma/client"

// El escáner (con la librería de cámara html5-qrcode) se carga sólo al entrar al modo QR,
// no en la carga inicial de /vigilante. ssr:false porque usa APIs del navegador.
const QrScanner = dynamic(
  () => import("@/components/vigilante/qr-scanner").then((m) => m.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-[280px] w-full max-w-sm items-center justify-center rounded-2xl border-2 border-border bg-black/90 text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    ),
  }
)

type VehiculoResult = { id: string; placa: string | null; marca?: string; modelo?: string; color?: string }
type VisitaResult = {
  id: string; codigoQR: string; estado: EstadoVisita
  nombreVisitante: string; dniVisitante: string; motivoVisita: string
  horaInicio: string; horaFin: string
  vehiculos: VehiculoResult[]
  residente: { id: string; nombre: string; direccion?: string; telefono?: string }
  registros: Array<{ id: string; fechaHoraIngreso: string }>
}

type ModoBusqueda = "placa" | "dni" | "qr"

export function BuscarCliente() {
  const [modoBusqueda, setModoBusqueda] = useState<ModoBusqueda>("placa")
  const [placa, setPlaca] = useState("")
  const [dni, setDni] = useState("")
  const [codigo, setCodigo] = useState("")
  const [scanKey, setScanKey] = useState(0) // bump para reiniciar la cámara del escáner
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
  const buscarPorPlaca = useCallback(async (placaValor?: string) => {
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

      if (data.encontrado) { vibrar(true); beep(true) }
      else { vibrar(false); beep(false) }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBuscando(false)
    }
  }, [placa])

  const buscarPorDni = useCallback(async () => {
    const d = dni.trim()
    if (!d || d.length !== 8) return

    setBuscando(true)
    setResultado(null)

    try {
      const res = await fetch(`/api/visitas/dni/${encodeURIComponent(d)}`)

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
      setPlacaBuscada(d)

      if (data.encontrado) { vibrar(true); beep(true) }
      else { vibrar(false); beep(false) }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBuscando(false)
    }
  }, [dni])

  const buscarPorCodigo = useCallback(async (codigoValor?: string) => {
    const c = (codigoValor ?? codigo).trim()
    if (!c) return

    setBuscando(true)
    setResultado(null)

    try {
      const res = await fetch(`/api/visitas/codigo/${encodeURIComponent(c)}`)

      if (res.status === 429) {
        toast.error("Demasiados escaneos. Espera un momento.")
        return
      }
      if (res.status === 400) {
        toast.error("El código QR no es válido.")
        return
      }
      if (!res.ok) {
        toast.error("Error al verificar. Intenta de nuevo.")
        return
      }

      const data = await res.json()
      setResultado(data)
      setPlacaBuscada(c)

      if (data.encontrado) { vibrar(true); beep(true) }
      else { vibrar(false); beep(false); setScanKey((k) => k + 1) } // no hallado → reactiva cámara para reintentar
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBuscando(false)
    }
  }, [codigo])

  const buscar =
    modoBusqueda === "placa" ? buscarPorPlaca
    : modoBusqueda === "dni" ? buscarPorDni
    : buscarPorCodigo

  function handlePlacaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, "")
    const formateada = normalizarPlacaInput(raw)
    setPlaca(formateada)
    setResultado(null)
  }

  function handleDniChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDni(e.target.value.replace(/\D/g, "").slice(0, 8))
    setResultado(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (modoBusqueda === "placa" && placa.trim()) buscarPorPlaca()
      if (modoBusqueda === "dni" && dni.length === 8) buscarPorDni()
      if (modoBusqueda === "qr" && codigo.trim()) buscarPorCodigo()
    }
  }

  // La cámara decodificó un QR → buscamos directo con ese código.
  function onEscaneo(texto: string) {
    setCodigo(texto)
    buscarPorCodigo(texto)
  }

  function limpiar() {
    setPlaca("")
    setDni("")
    setCodigo("")
    setResultado(null)
    setPlacaBuscada("")
    setScanKey((k) => k + 1)
    inputRef.current?.focus()
  }

  function cambiarModo(modo: ModoBusqueda) {
    setModoBusqueda(modo)
    setPlaca("")
    setDni("")
    setCodigo("")
    setResultado(null)
    setPlacaBuscada("")
    setScanKey((k) => k + 1)
  }

  function onAccionCompletada() {
    toast.success("Operación registrada exitosamente")
    vibrar(true)
    beep(true)
    limpiar()
  }

  const placaEsValida = validarPlaca(placa) || /^\d{3}$/.test(placa)
  const dniEsValido = /^[0-9]{8}$/.test(dni)

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-8 max-w-2xl mx-auto w-full">
      {/* ─── Selector de modo ──────────────────────────────────────────────── */}
      <div className="flex w-full rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => cambiarModo("placa")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            modoBusqueda === "placa"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Car className="h-4 w-4" /> Placa
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("dni")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            modoBusqueda === "dni"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <User className="h-4 w-4" /> DNI
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("qr")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            modoBusqueda === "qr"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <QrCode className="h-4 w-4" /> QR
        </button>
      </div>

      {/* ─── Input gigante ─────────────────────────────────────────────────── */}
      <div className="w-full space-y-4">
        {modoBusqueda === "placa" ? (
          <>
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
            <p className="text-center text-xs text-muted-foreground">
              Puedes buscar por placa completa o solo los{" "}
              <span className="text-foreground font-medium">últimos 3 dígitos</span>
            </p>
          </>
        ) : modoBusqueda === "dni" ? (
          <>
            <p className="text-center text-muted-foreground text-sm tracking-widest uppercase">
              Ingresa el DNI del visitante
            </p>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={handleDniChange}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={8}
              placeholder="12345678"
              aria-label="DNI del visitante"
              className={`
                w-full rounded-2xl border-2 bg-card text-center font-mono font-bold
                tracking-widest outline-none transition-all
                text-[clamp(2rem,8vw,3.5rem)] h-[80px] sm:h-[100px]
                placeholder:text-muted-foreground/30
                focus:ring-4
                ${dni && !dniEsValido
                  ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500/20"
                  : dniEsValido
                  ? "border-green-500 text-green-400 focus:border-green-500 focus:ring-green-500/20"
                  : "border-border focus:border-primary focus:ring-primary/20"
                }
              `}
            />
            <p className="text-center text-xs text-muted-foreground">
              Útil para visitantes{" "}
              <span className="text-foreground font-medium">sin vehículo</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-muted-foreground text-sm tracking-widest uppercase">
              Escanea el QR de la visita
            </p>

            {/* Cámara: al detectar el QR busca solo */}
            <QrScanner key={scanKey} onScan={onEscaneo} />

            {/* Fallback: tecleo manual del código */}
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                ¿La cámara no lee? Escribe el{" "}
                <span className="text-foreground font-medium">código de la visita</span>
              </p>
              <input
                ref={inputRef}
                type="text"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.trim()); setResultado(null) }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                placeholder="Código de visita"
                aria-label="Código de la visita"
                className="w-full rounded-2xl border-2 border-border bg-card text-center font-mono font-bold tracking-widest outline-none transition-all text-xl h-[64px] placeholder:text-muted-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </div>
          </>
        )}

        {/* Botón BUSCAR */}
        <Button
          onClick={() => buscar()}
          disabled={
            modoBusqueda === "placa" ? (!placa.trim() || buscando)
            : modoBusqueda === "dni" ? (!dniEsValido || buscando)
            : (!codigo.trim() || buscando)
          }
          size="2xl"
          className="w-full h-[70px] text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg"
        >
          {buscando ? (
            <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> {modoBusqueda === "qr" ? "Verificando..." : "Buscando..."}</>
          ) : (
            <><Search className="h-6 w-6 mr-3" /> {modoBusqueda === "qr" ? "VERIFICAR CÓDIGO" : "BUSCAR"}</>
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
                  {modoBusqueda === "placa" ? (
                    <Car className="h-8 w-8 text-destructive" />
                  ) : modoBusqueda === "dni" ? (
                    <User className="h-8 w-8 text-destructive" />
                  ) : (
                    <QrCode className="h-8 w-8 text-destructive" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-destructive">
                  {modoBusqueda === "placa" ? "Placa no registrada"
                    : modoBusqueda === "dni" ? "DNI no registrado"
                    : "Código no válido"}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {modoBusqueda === "qr" ? (
                    "El código no corresponde a una visita activa o pendiente"
                  ) : (
                    <><span className="font-mono font-bold">{placaBuscada}</span> no tiene visita activa o pendiente</>
                  )}
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
