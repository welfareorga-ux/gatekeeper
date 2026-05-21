import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Suspense } from "react"
import Link from "next/link"
import { Shield, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContrataServicioForm } from "./contratar-servicio-form"

export const metadata = { title: "Contratar Servicio — Gatekeeper" }

export default async function ContrataServicioPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const callbackUrl = `/contratar-servicio${params.tipo ? `?tipo=${params.tipo}` : ""}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Gatekeeper</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-10">
        {!session ? (
          <div className="max-w-md mx-auto flex flex-col items-center text-center py-20 space-y-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Inicia sesión para continuar</h1>
              <p className="text-muted-foreground text-sm">
                Necesitas una cuenta activa en Gatekeeper para contratar este servicio.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="flex-1"
              >
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
              <Link href="/registro" className="flex-1">
                <Button variant="outline" className="w-full">Crear cuenta</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ContrataServicioForm
              userEmail={session.user.email!}
              userName={session.user.nombre}
            />
          </Suspense>
        )}
      </main>
    </div>
  )
}
