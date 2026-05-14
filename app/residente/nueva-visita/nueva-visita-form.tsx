"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { nuevaVisitaSchema } from "@/lib/validations/visita"
import { normalizarPlacaInput, validarPlaca } from "@/lib/validations/placa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VisitaQrDialog } from "@/components/visitas/visita-qr-dialog"
import {
  PlusCircle, Trash2, Loader2, Car, User, Calendar, FileText
} from "lucide-react"

type VehiculoForm = { placa: string; marca: string; modelo: string; color: string }

const vehVacio = (): VehiculoForm => ({ placa: "", marca: "", modelo: "", color: "" })

export function NuevaVisitaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [visitaCreada, setVisitaCreada] = useState<{
    id: string; codigoQR: string; nombreVisitante: string;
    horaInicio: string; horaFin: string; vehiculos: VehiculoForm[]
  } | null>(null)

  // Cargar plantilla si viene desde /plantillas
  useEffect(() => {
    const raw = sessionStorage.getItem("gatekeeper_plantilla")
    if (raw) {
      try {
        const p = JSON.parse(raw) as { nombreVisitante: string; dniVisitante: string; motivoVisita: string; vehiculos: VehiculoForm[] }
        setNombreVisitante(p.nombreVisitante ?? "")
        setDniVisitante(p.dniVisitante ?? "")
        setMotivoVisita(p.motivoVisita ?? "")
        if (Array.isArray(p.vehiculos) && p.vehiculos.length > 0) {
          setVehiculos(p.vehiculos.slice(0, 3).map((v) => ({
            placa: v.placa ?? "", marca: v.marca ?? "", modelo: v.modelo ?? "", color: v.color ?? "",
          })))
        }
        sessionStorage.removeItem("gatekeeper_plantilla")
        toast.info("Plantilla cargada. Verifica los datos.")
      } catch { /* sin plantilla */ }
    }
  }, [])

  // Campos
  const [nombreVisitante, setNombreVisitante] = useState("")
  const [dniVisitante, setDniVisitante] = useState("")
  const [motivoVisita, setMotivoVisita] = useState("")
  const [fechaProgramada, setFechaProgramada] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFin, setHoraFin] = useState("11:00")
  const [vehiculos, setVehiculos] = useState<VehiculoForm[]>([vehVacio()])
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [guardarComoPlantilla, setGuardarComoPlantilla] = useState(false)
  const [nombreAlias, setNombreAlias] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Vehículos ──────────────────────────────────────────────────────────────
  function agregarVehiculo() {
    if (vehiculos.length < 3) setVehiculos([...vehiculos, vehVacio()])
  }

  function eliminarVehiculo(i: number) {
    setVehiculos(vehiculos.filter((_, idx) => idx !== i))
  }

  function actualizarVehiculo(i: number, field: keyof VehiculoForm, value: string) {
    const copia = [...vehiculos]
    if (field === "placa") {
      copia[i][field] = normalizarPlacaInput(value)
    } else {
      copia[i][field] = value
    }
    setVehiculos(copia)

    // Limpiar error de placa en tiempo real
    if (field === "placa") {
      const k = `vehiculos.${i}.placa`
      if (errors[k]) setErrors((e) => { const copy = { ...e }; delete copy[k]; return copy })
    }
  }

  function placaValida(placa: string) {
    if (!placa) return null
    return validarPlaca(placa)
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const data = {
      nombreVisitante, dniVisitante, motivoVisita,
      fechaProgramada, horaInicio, horaFin, vehiculos,
      esRecurrente, guardarComoPlantilla,
      ...(guardarComoPlantilla ? { nombreAlias } : {}),
    }

    const parsed = nuevaVisitaSchema.safeParse(data)
    if (!parsed.success) {
      const errMap: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const key = issue.path.join(".")
        errMap[key] = issue.message
      })
      setErrors(errMap)
      toast.error("Revisa los campos marcados en rojo")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al crear la visita")
        return
      }

      const visita = await res.json()
      toast.success("Visita registrada exitosamente")
      setVisitaCreada({
        id: visita.id,
        codigoQR: visita.codigoQR,
        nombreVisitante: visita.nombreVisitante,
        horaInicio: visita.horaInicio,
        horaFin: visita.horaFin,
        vehiculos: visita.vehiculos,
      })
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visitante */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Datos del visitante
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                placeholder="Ej. Juan Pérez García"
                value={nombreVisitante}
                onChange={(e) => setNombreVisitante(e.target.value)}
              />
              {errors.nombreVisitante && <p className="text-xs text-destructive">{errors.nombreVisitante}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI (8 dígitos) *</Label>
              <Input
                id="dni"
                placeholder="12345678"
                maxLength={8}
                value={dniVisitante}
                onChange={(e) => setDniVisitante(e.target.value.replace(/\D/g, ""))}
              />
              {errors.dniVisitante && <p className="text-xs text-destructive">{errors.dniVisitante}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motivo">Motivo de la visita *</Label>
              <Input
                id="motivo"
                placeholder="Ej. Visita familiar, técnico, entrega de paquete..."
                value={motivoVisita}
                onChange={(e) => setMotivoVisita(e.target.value)}
              />
              {errors.motivoVisita && <p className="text-xs text-destructive">{errors.motivoVisita}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Fecha y hora */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Fecha y horario esperado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaProgramada}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFechaProgramada(e.target.value)}
              />
              {errors.fechaProgramada && <p className="text-xs text-destructive">{errors.fechaProgramada}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de llegada *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora de salida estimada *</Label>
              <Input
                id="horaFin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
              {errors.horaFin && <p className="text-xs text-destructive">{errors.horaFin}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Vehículos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" /> Vehículo(s)
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({vehiculos.length}/3)
                </span>
              </CardTitle>
              {vehiculos.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={agregarVehiculo}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Agregar vehículo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.vehiculos && (
              <p className="text-sm text-destructive">{errors.vehiculos}</p>
            )}
            {vehiculos.map((veh, i) => (
              <div key={i} className="space-y-3">
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Vehículo {i + 1}
                  </p>
                  {i > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7 px-2"
                      onClick={() => eliminarVehiculo(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Placa *</Label>
                    <div className="relative">
                      <Input
                        placeholder="A1B-234"
                        value={veh.placa}
                        onChange={(e) => actualizarVehiculo(i, "placa", e.target.value)}
                        className={`font-mono uppercase ${
                          veh.placa && !placaValida(veh.placa)
                            ? "border-destructive focus-visible:ring-destructive"
                            : veh.placa && placaValida(veh.placa)
                            ? "border-green-500 focus-visible:ring-green-500"
                            : ""
                        }`}
                        maxLength={9}
                      />
                    </div>
                    {errors[`vehiculos.${i}.placa`] && (
                      <p className="text-xs text-destructive">{errors[`vehiculos.${i}.placa`]}</p>
                    )}
                    {veh.placa && !validarPlaca(veh.placa) && (
                      <p className="text-xs text-muted-foreground">
                        Formatos válidos: A1B-234 / ABC-123 / A1-2345
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Marca</Label>
                    <Input
                      placeholder="Toyota"
                      value={veh.marca}
                      onChange={(e) => actualizarVehiculo(i, "marca", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Modelo</Label>
                    <Input
                      placeholder="Yaris"
                      value={veh.modelo}
                      onChange={(e) => actualizarVehiculo(i, "modelo", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <Input
                      placeholder="Blanco"
                      value={veh.color}
                      onChange={(e) => actualizarVehiculo(i, "color", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Opciones adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurrente"
                checked={esRecurrente}
                onCheckedChange={(v) => setEsRecurrente(v === true)}
              />
              <Label htmlFor="recurrente" className="cursor-pointer">
                Visita recurrente (el visitante viene regularmente)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="plantilla"
                checked={guardarComoPlantilla}
                onCheckedChange={(v) => setGuardarComoPlantilla(v === true)}
              />
              <Label htmlFor="plantilla" className="cursor-pointer">
                Guardar como visita frecuente (plantilla)
              </Label>
            </div>

            {guardarComoPlantilla && (
              <div className="ml-6 space-y-1.5">
                <Label htmlFor="alias" className="text-sm">Nombre de la plantilla *</Label>
                <Input
                  id="alias"
                  placeholder="Ej. Gasero, Empleada del hogar, Doctor García..."
                  value={nombreAlias}
                  onChange={(e) => setNombreAlias(e.target.value)}
                  className="max-w-sm"
                />
                {errors.nombreAlias && <p className="text-xs text-destructive">{errors.nombreAlias}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:min-w-40">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</>
            ) : (
              "Registrar visita"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/residente/dashboard")}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modal QR post-creación */}
      {visitaCreada && (
        <VisitaQrDialog
          open={true}
          onClose={() => {
            setVisitaCreada(null)
            router.push("/residente/historial")
          }}
          visita={visitaCreada}
        />
      )}
    </>
  )
}
