import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const ip = getClientIP(req)
  if (!checkRateLimit(`verif-email:ip:${ip}`, 20, 5 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")?.toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const existe = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return NextResponse.json({ registrado: !!existe })
}
