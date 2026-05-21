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

  // Solo ADMINs pueden recuperar contraseña por este flujo
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, nombre: true, activo: true, rol: true },
  })

  if (user && user.activo && user.rol === "ADMIN") {
    await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } })

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    })

    const baseUrl = new URL(req.url).origin
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    try {
      await enviarEmailRecuperarContrasena({ email: normalizedEmail, nombre: user.nombre, resetUrl })
      console.log("[forgot-password] Email enviado a:", normalizedEmail, "URL:", resetUrl)
    } catch (err) {
      console.error("[forgot-password] Error al enviar email:", err)
      return NextResponse.json({ error: "Error al enviar el correo. Revisa los logs." }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
