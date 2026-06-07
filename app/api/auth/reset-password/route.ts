import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!checkRateLimit(`reset:ip:${ip}`, 10, 15 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429 }
    )
  }

  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken) {
    return NextResponse.json({ error: "El enlace no es válido" }, { status: 400 })
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    return NextResponse.json({ error: "El enlace ha expirado. Solicita uno nuevo." }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hash },
  })

  await prisma.passwordResetToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
