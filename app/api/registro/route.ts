import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { enviarEmailTrialBienvenida } from "@/lib/email"

const registroSchema = z.object({
  nombreCondominio: z.string().min(3, "Mínimo 3 caracteres").max(100),
  direccion: z.string().min(5, "Ingresa la dirección completa").max(200),
  adminNombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = registroSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { nombreCondominio, direccion, adminNombre, adminEmail, adminPassword } = result.data

  const existe = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } })
  if (existe) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 })
  }

  const hash = await bcrypt.hash(adminPassword, 12)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const { condominio, admin } = await prisma.$transaction(async (tx) => {
    const condominio = await tx.condominio.create({
      data: {
        nombre: nombreCondominio,
        direccion,
        plan: "BASICO",
        suscripcionEstado: "trial",
        trialEndsAt,
      },
    })
    const admin = await tx.user.create({
      data: {
        nombre: adminNombre,
        email: adminEmail.toLowerCase(),
        password: hash,
        rol: "ADMIN",
        condominioId: condominio.id,
      },
    })
    await tx.logActividad.create({
      data: {
        userId: admin.id,
        accion: "REGISTRO_TRIAL",
        detalle: JSON.stringify({ condominio: nombreCondominio, trialEndsAt }),
      },
    })
    return { condominio, admin }
  })

  void enviarEmailTrialBienvenida({
    email: adminEmail,
    nombre: adminNombre,
    condominioNombre: nombreCondominio,
    trialEndsAt,
    loginUrl: `${process.env.NEXTAUTH_URL ?? "https://gatekeeper-app.org"}/login`,
  })

  return NextResponse.json(
    { ok: true, condominioId: condominio.id, email: admin.email },
    { status: 201 }
  )
}
