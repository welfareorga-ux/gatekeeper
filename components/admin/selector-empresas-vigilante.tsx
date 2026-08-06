"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2 } from "lucide-react"

type EmpresaOpcion = { id: string; nombre: string; activo: boolean }

interface Props {
  empresas: EmpresaOpcion[]
  /** Ids seleccionados. Vacío = el vigilante ve todas las visitas. */
  seleccionadas: string[]
  onChange: (ids: string[]) => void
}

/**
 * Empresas que vigila un vigilante. A diferencia del residente —que pertenece a
 * UNA empresa— aquí se eligen varias, porque un vigilante suele cubrir distintas
 * oficinas del mismo edificio.
 *
 * Dejarlo vacío es válido y es lo normal en un condominio residencial: sin
 * ninguna marcada, el vigilante ve todas las visitas de la organización.
 */
export function SelectorEmpresasVigilante({ empresas, seleccionadas, onChange }: Props) {
  const disponibles = empresas.filter((e) => e.activo || seleccionadas.includes(e.id))
  if (disponibles.length === 0) return null

  function alternar(id: string, marcada: boolean) {
    onChange(marcada ? [...seleccionadas, id] : seleccionadas.filter((x) => x !== id))
  }

  return (
    <div className="col-span-2 space-y-1.5">
      <Label className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        Empresas que vigila <span className="text-muted-foreground font-normal">(opcional)</span>
      </Label>
      <div className="rounded-md border divide-y max-h-44 overflow-y-auto">
        {disponibles.map((e) => (
          <label
            key={e.id}
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
          >
            <Checkbox
              checked={seleccionadas.includes(e.id)}
              onCheckedChange={(v) => alternar(e.id, v === true)}
            />
            <span className={e.activo ? "" : "text-muted-foreground line-through"}>{e.nombre}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {seleccionadas.length === 0
          ? "Sin marcar ninguna: verá todas las visitas del edificio. Es lo normal en un condominio."
          : `Solo verá las visitas de ${seleccionadas.length === 1 ? "esta empresa" : `estas ${seleccionadas.length} empresas`}.`}
      </p>
    </div>
  )
}
