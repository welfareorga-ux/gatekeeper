import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { EstadoVisita } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: { codigoQR: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const ip = getClientIP(req)
  const { allowed, remaining } = await checkRateLimit(`codigo:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados escaneos. Espera un momento." },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    )
  }

  const codigo = decodeURIComponent(params.codigoQR).trim()
  // El codigoQR es un cuid (alfanumérico, sin símbolos raros). Filtramos entradas inválidas
  // para no golpear la BD con basura escaneada de un QR ajeno.
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(codigo)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 })
  }

  let visita
  try {
    // findFirst (no findUnique) + withTenant: condominioId inyectado y RLS por contexto.
    visita = await withTenant(condominioId, (tx) => tx.visita.findFirst({
      where: {
        codigoQR: codigo,
        estado: { notIn: [EstadoVisita.CANCELADO] },
      },
      include: {
        vehiculos: true,
        residente: { select: { id: true, nombre: true, direccion: true, telefono: true } },
        registros: { where: { fechaHoraSalida: null }, take: 1, orderBy: { fechaHoraIngreso: "desc" } },
      },
    }))
  } catch (err) {
    console.error("[codigo] DB error:", err)
    return NextResponse.json({ error: "Error de base de datos", detail: String(err) }, { status: 500 })
  }

  if (!visita) {
    return NextResponse.json(
      { encontrado: false, mensaje: "El código QR no corresponde a una visita activa" },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }

  // Mismo formato {encontrado, visitas} que /placa y /dni para reutilizar la UI.
  return NextResponse.json(
    { encontrado: true, visitas: [visita] },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  )
}
