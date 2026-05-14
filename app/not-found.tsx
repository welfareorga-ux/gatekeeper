import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center text-center px-4 space-y-6 max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-7xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-xl font-bold">Página no encontrada</h1>
          <p className="text-sm text-muted-foreground">
            La ruta que intentas acceder no existe o fue movida.
          </p>
        </div>
        <Link href="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
