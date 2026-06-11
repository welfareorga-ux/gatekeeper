import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { runAsAdmin } from "@/lib/tenant"
import bcrypt from "bcryptjs"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { password } = await req.json().catch(() => ({}))
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  // SuperAdmin gestiona cualquier condominio → bypass RLS.
  return runAsAdmin(async (tx) => {
    const admin = await tx.user.findFirst({
      where: { condominioId: params.id, rol: "ADMIN", activo: true },
      select: { id: true, nombre: true, email: true },
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 })
    }

    await tx.user.update({ where: { id: admin.id }, data: { password: hash } })

    return NextResponse.json({ ok: true, adminEmail: admin.email, adminNombre: admin.nombre })
  })
}
