import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const usuario = await db.user.findFirst({ where: { id: params.id } })
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const hash = await bcrypt.hash(result.data.password, 12)
  await db.user.update({ where: { id: params.id }, data: { password: hash } })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "RESET_PASSWORD",
      detalle: JSON.stringify({ targetId: params.id, targetEmail: usuario.email }),
    },
  })

  return NextResponse.json({ ok: true })
}
