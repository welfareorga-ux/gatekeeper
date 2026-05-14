"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, ArrowRight, BookMarked, PlusCircle, Car } from "lucide-react"

type Plantilla = {
  id: string
  nombreAlias: string
  datosVisitanteJSON: { nombreVisitante: string; dniVisitante: string; motivoVisita: string }
  datosVehiculoJSON: Array<{ placa: string; marca?: string; modelo?: string; color?: string }>
  createdAt: string
}

export function PlantillasCliente() {
  const router = useRouter()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/plantillas")
      .then((r) => r.json())
      .then(setPlantillas)
      .catch(() => toast.error("Error al cargar plantillas"))
      .finally(() => setLoading(false))
  }, [])

  async function eliminarPlantilla(id: string) {
    try {
      const res = await fetch(`/api/plantillas?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPlantillas((prev) => prev.filter((p) => p.id !== id))
      toast.success("Plantilla eliminada")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setEliminando(null)
    }
  }

  function usarPlantilla(p: Plantilla) {
    // Guardar en sessionStorage para pre-llenar el formulario
    sessionStorage.setItem(
      "gatekeeper_plantilla",
      JSON.stringify({
        nombreVisitante: p.datosVisitanteJSON.nombreVisitante,
        dniVisitante: p.datosVisitanteJSON.dniVisitante,
        motivoVisita: p.datosVisitanteJSON.motivoVisita,
        vehiculos: p.datosVehiculoJSON,
      })
    )
    router.push("/residente/nueva-visita")
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }

  if (plantillas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookMarked className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-medium mb-1">Sin plantillas guardadas</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Cuando registres una visita y marques &ldquo;Guardar como visita frecuente&rdquo;, aparecerá aquí.
        </p>
        <Button variant="outline" onClick={() => router.push("/residente/nueva-visita")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Registrar visita
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plantillas.map((p) => (
          <Card key={p.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{p.nombreAlias}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                  onClick={() => setEliminando(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <p className="font-medium">{p.datosVisitanteJSON.nombreVisitante}</p>
                <p className="text-muted-foreground text-xs">DNI: {p.datosVisitanteJSON.dniVisitante}</p>
                <p className="text-muted-foreground text-xs truncate">{p.datosVisitanteJSON.motivoVisita}</p>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <Car className="h-3 w-3 text-muted-foreground" />
                {p.datosVehiculoJSON.map((v, i) => (
                  <Badge key={i} variant="outline" className="font-mono text-xs">
                    {v.placa}
                  </Badge>
                ))}
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => usarPlantilla(p)}
              >
                Usar esta plantilla
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!eliminando} onOpenChange={(v) => { if (!v) setEliminando(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente. No afecta las visitas ya registradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => eliminando && eliminarPlantilla(eliminando)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
