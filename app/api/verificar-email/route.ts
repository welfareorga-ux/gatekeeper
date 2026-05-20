import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")?.toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const existe = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return NextResponse.json({ registrado: !!existe })
}
