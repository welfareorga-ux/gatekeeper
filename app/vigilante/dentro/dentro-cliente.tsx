"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Car, MapPin, Clock, LogOut, RefreshCw, Users } from "lucide-react"

type RegistroDentro = {
  id: string
  fechaHoraIngreso: string
  vehiculo: { id: string; placa: string | null; marca?: string; modelo?: string; color?: string } | null
  visita: {
    id: string
    nombreVisitante: string
    motivoVisita: string
    residente: { nombre: string; direccion?: string }
  }
  vigilanteIngreso: { nombre: string } | null
}

function tiempoTranscurrido(desde: string): string {
  const ms = Date.now() - new Date(desde).getTime()
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function DentroCliente() {
  const [registros, setRegistros] = useState<RegistroDentro[]>([])
  const [loading, setLoading] = useState(true)
  const [registrandoSalida, setRegistrandoSalida] = useState<string | null>(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [, forceUpdate] = useState(0)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/registros/dentro")
      if (!res.ok) throw new Error()
      setRegistros(await res.json())
      setUltimaActualizacion(new Date())
    } catch {
      toast.error("Error al cargar vehículos dentro")
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial y refresco cada 30 segundos
  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 30_000)
    return () => clearInterval(intervalo)
  }, [cargar])

  // Actualiza el tiempo transcurrido cada 60 segundos
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  async function registrarSalida(visitaId: string) {
    try {
      const res = await fetch("/api/registros/salida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitaId }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al registrar salida")
        return
      }
      toast.success("Salida registrada")
      cargar()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setRegistrandoSalida(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Header con contador y refresco */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {registros.length} visitante{registros.length !== 1 ? "s" : ""} dentro
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Actualizado: {ultimaActualizacion.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cargar} title="Actualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No hay vehículos dentro</p>
          <p className="text-sm text-muted-foreground mt-1">El condominio está vacío</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 space-y-3">
                  {/* Placa / sin vehículo */}
                  <div className="flex items-center gap-3">
                    {r.vehiculo ? (
                      <>
                        <Badge variant="outline" className="font-mono text-xl px-3 py-1.5 h-10">
                          {r.vehiculo.placa ?? "Sin placa"}
                        </Badge>
                        {(r.vehiculo.marca || r.vehiculo.color) && (
                          <span className="text-sm text-muted-foreground">
                            {[r.vehiculo.marca, r.vehiculo.modelo, r.vehiculo.color].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-sm px-3 py-1.5 h-10 text-muted-foreground">
                        Sin vehículo
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{r.visita.residente.direccion ?? "Sin dirección"}</p>
                        <p className="text-muted-foreground text-xs">{r.visita.residente.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Car className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{r.visita.nombreVisitante}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-40">{r.visita.motivoVisita}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-orange-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-bold">{tiempoTranscurrido(r.fechaHoraIngreso)}</span>
                      <span className="text-muted-foreground text-xs">
                        (ingresó {new Date(r.fechaHoraIngreso).toLocaleTimeString("es-PE", {
                          hour: "2-digit", minute: "2-digit", hour12: false
                        })})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón salida */}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-[60px] min-w-[130px] border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white shrink-0"
                  onClick={() => setRegistrandoSalida(r.visita.id)}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Salida
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmación salida */}
      <AlertDialog open={!!registrandoSalida} onOpenChange={(v) => { if (!v) setRegistrandoSalida(null) }}>
        <AlertDialogContent className="dark bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Registrar salida?</AlertDialogTitle>
            <AlertDialogDescription>
              El vehículo quedará registrado como SALIDO y no podrá volver a ingresar con esta visita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => registrandoSalida && registrarSalida(registrandoSalida)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Confirmar salida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
