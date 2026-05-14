import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const actualizarSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100).optional(),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const body = await req.json()

  if (params.id === session.user.id && body.activo === false) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 })
  }

  const result = actualizarSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Ensure target user belongs to the same condominio
  const target = await prisma.user.findFirst({ where: { id: params.id, condominioId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const usuario = await prisma.user.update({
    where: { id: params.id },
    data: result.data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, telefono: true, direccion: true },
  })

  await prisma.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "ACTUALIZAR_USUARIO",
      detalle: JSON.stringify({ targetId: params.id, cambios: result.data }),
    },
  })

  return NextResponse.json(usuario)
}
