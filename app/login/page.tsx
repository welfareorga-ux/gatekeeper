import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { LoginForm } from "./login-form"
import { Shield } from "lucide-react"

export const metadata = { title: "Iniciar Sesión — Gatekeeper" }

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const rol = session.user.rol
    if (rol === "ADMIN") redirect("/admin/dashboard")
    if (rol === "VIGILANTE") redirect("/vigilante")
    redirect("/residente/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Marca */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Shield className="w-9 h-9 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gatekeeper</h1>
          <p className="text-slate-400 mt-1 text-sm">Control de Visitas Vehiculares</p>
        </div>

        <LoginForm />

        <p className="text-center text-slate-500 text-xs mt-6">
          Sistema de acceso restringido. Solo personal autorizado.
        </p>
      </div>
    </div>
  )
}
