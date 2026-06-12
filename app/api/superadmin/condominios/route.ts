import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { runAsAdmin } from "@/lib/tenant"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // El _count incluye usuarios/visitas (tablas con RLS): debe correr con bypass
  // (runAsAdmin) o saldría 0 en todos los condominios bajo el rol app_tenant.
  const condominios = await runAsAdmin((tx) =>
    tx.condominio.findMany({
      include: {
        _count: { select: { usuarios: true, visitas: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  )

  return NextResponse.json(condominios)
}
