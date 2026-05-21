import { Suspense } from "react"
import { RegistroForm } from "./registro-form"
import Link from "next/link"
import { Shield, Loader2 } from "lucide-react"

export const metadata = { title: "Registrar Condominio — Gatekeeper" }

export default function RegistroPage() {
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/" className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Gatekeeper</h1>
              <p className="text-muted-foreground text-sm mt-1">
                14 días gratis · Sin tarjeta de crédito
              </p>
            </div>
          </div>

          <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <RegistroForm />
          </Suspense>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
