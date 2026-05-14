"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PlayCircle, StopCircle, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { formatFechaHora, formatTiempo } from "@/lib/utils"

interface Props {
  turnoActivo: { id: string; inicio: string } | null
  ultimosTurnos: Array<{ id: string; inicio: string; fin: string | null; activo: boolean }>
}

export function TurnoCliente({ turnoActivo: turnoInicial, ultimosTurnos }: Props) {
  const router = useRouter()
  const [turnoActivo, setTurnoActivo] = useState(turnoInicial)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [confirmarFin, setConfirmarFin] = useState(false)

  // Actualizar reloj cada 30 segundos
  useEffect(() => {
    function actualizar() {
      if (!turnoActivo) { setTiempoTranscurrido(""); return }
      const ms = Date.now() - new Date(turnoActivo.inicio).getTime()
      setTiempoTranscurrido(formatTiempo(ms))
    }
    actualizar()
    const t = setInterval(actualizar, 30_000)
    return () => clearInterval(t)
  }, [turnoActivo])

  async function iniciarTurno() {
    setProcesando(true)
    try {
      const res = await fetch("/api/turnos/iniciar", { method: "POST" })
      if (!res.ok) { toast.error("Error al iniciar turno"); return }
      const turno = await res.json()
      setTurnoActivo({ id: turno.id, inicio: turno.horaInicioTurno })
      toast.success("Turno iniciado. ¡Buena guardia!")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setProcesando(false)
    }
  }

  async function finalizarTurno() {
    setProcesando(true)
    try {
      const res = await fetch("/api/turnos/finalizar", { method: "POST" })
      if (!res.ok) { toast.error("Error al finalizar turno"); return }
      setTurnoActivo(null)
      toast.success("Turno finalizado. ¡Hasta la próxima!")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setProcesando(false)
      setConfirmarFin(false)
    }
  }

  return (
    <>
      {/* Estado actual del turno */}
      <Card className={turnoActivo ? "border-green-600" : "border-border"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Estado del turno</CardTitle>
            {turnoActivo ? (
              <Badge variant="success" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary">Sin turno</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {turnoActivo ? (
            <>
              <div className="text-center py-4 space-y-1">
                <p className="text-4xl font-bold text-green-400">{tiempoTranscurrido}</p>
                <p className="text-muted-foreground text-sm">de guardia</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Inicio: {formatFechaHora(turnoActivo.inicio)}
                </p>
              </div>

              <Button
                variant="outline"
                size="xl"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => setConfirmarFin(true)}
                disabled={procesando}
              >
                {procesando ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <StopCircle className="h-5 w-5 mr-2" />
                )}
                Finalizar turno
              </Button>
            </>
          ) : (
            <>
              <div className="text-center py-4 space-y-1">
                <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No hay turno activo</p>
                <p className="text-xs text-muted-foreground">Inicia tu turno para comenzar a registrar ingresos y salidas</p>
              </div>

              <Button
                size="xl"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={iniciarTurno}
                disabled={procesando}
              >
                {procesando ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-5 w-5 mr-2" />
                )}
                Iniciar turno
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Historial de turnos */}
      {ultimosTurnos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Turnos recientes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {ultimosTurnos.map((t) => {
              const duracion = t.fin
                ? formatTiempo(new Date(t.fin).getTime() - new Date(t.inicio).getTime())
                : null
              return (
                <div key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatFechaHora(t.inicio)}</p>
                    {t.fin && (
                      <p className="text-xs text-muted-foreground">
                        Finalizó: {new Date(t.fin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {duracion && <span className="text-xs text-muted-foreground">{duracion}</span>}
                    {t.activo ? (
                      <Badge variant="success" className="gap-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Activo
                      </Badge>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Confirmación finalizar turno */}
      <AlertDialog open={confirmarFin} onOpenChange={setConfirmarFin}>
        <AlertDialogContent className="dark bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar el turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu turno ha durado {tiempoTranscurrido}. Al finalizar, no podrás registrar nuevos
              ingresos o salidas hasta iniciar un nuevo turno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar en servicio</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={finalizarTurno}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Sí, finalizar turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
