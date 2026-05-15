import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  tokenId: z.string().min(1),
  plan: z.enum(["BASICO", "ESTANDAR", "PREMIUM"]),
  amount: z.number().int().positive(),
  nombreCondominio: z.string().min(3).max(100),
  direccion: z.string().min(5).max(200),
  adminNombre: z.string().min(3).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const {
    tokenId, plan, amount,
    nombreCondominio, direccion,
    adminNombre, adminEmail, adminPassword,
  } = result.data

  // Procesar cargo con Culqi
  const secretKey = process.env.CULQI_SECRET_KEY
  if (secretKey) {
    const chargeRes = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency_code: "PEN",
        email: adminEmail,
        source_id: tokenId,
        description: `Gatekeeper — Plan ${plan}`,
        metadata: { plan, condominio: nombreCondominio },
      }),
    })

    if (!chargeRes.ok) {
      const err = await chargeRes.json().catch(() => ({}))
      const msg =
        (err as { user_message?: string }).user_message ??
        "El pago fue rechazado. Verifica los datos de tu tarjeta."
      return NextResponse.json({ error: msg }, { status: 402 })
    }
  }

  // Crear cuenta
  const existe = await prisma.user.findUnique({ where: { email: adminEmail.toLowerCase() } })
  if (existe) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 })
  }

  const hash = await bcrypt.hash(adminPassword, 12)

  await prisma.$transaction(async (tx) => {
    const condominio = await tx.condominio.create({
      data: { nombre: nombreCondominio, direccion, plan },
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
        accion: "REGISTRO_CONDOMINIO",
        detalle: JSON.stringify({ condominio: nombreCondominio, plan }),
      },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
