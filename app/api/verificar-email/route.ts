import { NextResponse } from "next/server"
import { runAsAdmin } from "@/lib/tenant"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const ip = getClientIP(req)
  if (!(await checkRateLimit(`verif-email:ip:${ip}`, 20, 5 * 60_000)).allowed) {
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

  // Chequeo público de existencia por email → bypass RLS.
  const existe = await runAsAdmin((tx) => tx.user.findUnique({ where: { email }, select: { id: true } }))
  return NextResponse.json({ registrado: !!existe })
}
