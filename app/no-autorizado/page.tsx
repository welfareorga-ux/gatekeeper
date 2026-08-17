import Link from "next/link"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  robots: { index: false, follow: true }, title: "Acceso Denegado — Gatekeeper" }

export default function NoAutorizadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <ShieldX className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-sm">
          No tienes permisos para acceder a esta sección del sistema.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
