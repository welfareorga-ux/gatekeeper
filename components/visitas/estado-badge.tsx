import { Badge } from "@/components/ui/badge"
import type { EstadoVisita } from "@prisma/client"

const CONFIG: Record<EstadoVisita, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" | "outline" }> = {
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  INGRESADO: { label: "Ingresado", variant: "success" },
  SALIDO: { label: "Salido", variant: "secondary" },
  EXPIRADO: { label: "Expirado", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "outline" },
}

export function EstadoBadge({ estado }: { estado: EstadoVisita }) {
  const { label, variant } = CONFIG[estado]
  return <Badge variant={variant}>{label}</Badge>
}
