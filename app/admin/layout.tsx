import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { PlanGratisBanner } from "@/components/admin/plan-gratis-banner"
import { EspacioPublicitario } from "@/components/ads/espacio-publicitario"
import Link from "next/link"
import { fechaLimaTexto, finGraciaCobro, saldoExtraVigente, visitasUsadasEsteMes } from "@/lib/limites-plan"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.rol !== "ADMIN") redirect("/no-autorizado")

  // El plan GRATIS no caduca, así que no hay cuenta atrás: solo un aviso
  // permanente y discreto con la vía para pasar a Pro.
  let enPlanGratis = false
  let visitasUsadas = 0
  let visitasExtra = 0
  // Periodo de gracia tras un cobro fallido de Pro: fecha límite para pagar.
  let limiteGracia: string | null = null
  if (session.user.condominioId) {
    const condo = await prisma.condominio.findUnique({
      where: { id: session.user.condominioId },
      select: {
        plan: true, visitasMes: true, visitasMesInicio: true, visitasExtra: true, visitasExtraInicio: true,
        cobroFallidoEn: true,
      },
    })
    enPlanGratis = condo?.plan === "GRATIS"
    if (condo) {
      visitasUsadas = visitasUsadasEsteMes(condo)
      visitasExtra = saldoExtraVigente(condo)
      if (condo.plan === "PRO" && condo.cobroFallidoEn) {
        limiteGracia = fechaLimaTexto(finGraciaCobro(condo.cobroFallidoEn))
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        variant="admin"
        userNombre={session.user.nombre}
        rolLabel="Panel Admin"
      />
      <main className="flex-1 overflow-auto bg-background pt-14 md:pt-0">
        {enPlanGratis && <PlanGratisBanner visitasUsadas={visitasUsadas} visitasExtra={visitasExtra} />}
        {limiteGracia && (
          <div className="bg-red-600 text-white px-4 py-2.5 print:hidden">
            <div className="container max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                <strong>Tu pago del plan Pro falló.</strong> Si no pagas hasta el {limiteGracia}, pasarás al
                plan Gratis y se eliminarán los vigilantes y residentes que excedan su límite, con sus visitas.
              </p>
              <Link href="/admin/suscripcion" className="font-semibold underline underline-offset-4 whitespace-nowrap">
                Pagar ahora →
              </Link>
            </div>
          </div>
        )}
        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
          {children}
          {enPlanGratis && <EspacioPublicitario slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ADMIN} conEnlacePro />}
        </div>
      </main>
    </div>
  )
}
