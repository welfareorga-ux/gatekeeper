import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  activo: z.boolean().optional(),
  plan: z.enum(["BASICO", "ESTANDAR", "PREMIUM"]).optional(),
  nombre: z.string().min(3).optional(),
  ruc: z.string().optional(),
  telefono: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const condominio = await prisma.condominio.update({
    where: { id: params.id },
    data: result.data,
  })

  return NextResponse.json(condominio)
}
