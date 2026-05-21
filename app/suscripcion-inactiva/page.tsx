import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SuscripcionInactivaClient } from "./suscripcion-inactiva-client"

export const metadata = { title: "Suscripción inactiva — Gatekeeper" }

export default async function SuscripcionInactivaPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  const condominio = await prisma.condominio.findUnique({
    where: { id: session.user.condominioId! },
    select: { nombre: true, plan: true, suscripcionEstado: true },
  })

  // Si la suscripción está activa, volver al panel (sesión ya se actualizó)
  if (condominio?.suscripcionEstado === "activa") redirect("/admin/dashboard")

  const PLAN_LABEL: Record<string, string> = {
    BASICO: "Básico",
    ESTANDAR: "Estándar",
    PREMIUM: "Premium",
  }

  return (
    <SuscripcionInactivaClient
      adminNombre={session.user.nombre}
      adminEmail={session.user.email!}
      condominioNombre={condominio?.nombre ?? ""}
      planLabel={PLAN_LABEL[condominio?.plan ?? ""] ?? condominio?.plan ?? ""}
      estado={condominio?.suscripcionEstado ?? "inactiva"}
    />
  )
}
