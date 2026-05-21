import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enviarEmailRecuperarContrasena } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Siempre responder OK para no revelar si el email existe
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, nombre: true, activo: true },
  })

  if (user && user.activo) {
    // Borrar tokens anteriores del mismo email
    await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } })

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    await enviarEmailRecuperarContrasena({
      email: normalizedEmail,
      nombre: user.nombre,
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    })
  }

  return NextResponse.json({ ok: true })
}
