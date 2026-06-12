import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { runAsAdmin } from "@/lib/tenant"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Listado cross-tenant: User tiene RLS → debe correr con bypass (runAsAdmin).
  const usuarios = await runAsAdmin((tx) =>
    tx.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        isSuperAdmin: true,
        condominioId: true,
        createdAt: true,
        condominio: { select: { nombre: true } },
      },
      orderBy: [{ condominioId: "asc" }, { rol: "asc" }, { nombre: "asc" }],
    })
  )

  return NextResponse.json(usuarios)
}
