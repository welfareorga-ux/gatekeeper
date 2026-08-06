import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { filtroEmpresaVigilante } from "@/lib/empresa"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { EstadoVisita } from "@prisma/client"

const PRIORIDAD: Record<EstadoVisita, number> = {
  INGRESADO: 1, PENDIENTE: 2, SALIDO: 3, EXPIRADO: 4, CANCELADO: 5,
}

export async function GET(req: NextRequest, { params }: { params: { dni: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const ip = getClientIP(req)
  const { allowed, remaining } = await checkRateLimit(`dni:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas búsquedas. Espera un momento." },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    )
  }

  const dni = decodeURIComponent(params.dni).trim().replace(/\D/g, "")
  if (!/^[0-9]{8}$/.test(dni)) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
  }

  let visitas
  try {
    visitas = await withTenant(condominioId, async (tx) => tx.visita.findMany({
      where: {
        dniVisitante: dni,
        estado: { notIn: [EstadoVisita.CANCELADO] },
        ...(await filtroEmpresaVigilante(tx, session.user.id)),
      },
      include: {
        vehiculos: true,
        // El teléfono del residente NO se expone: el vigilante no necesita llamarlo
        // (la plataforma le notifica el ingreso/salida por email automáticamente).
        residente: { select: { id: true, nombre: true, direccion: true } },
        registros: { where: { fechaHoraSalida: null }, take: 1, orderBy: { fechaHoraIngreso: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }))
  } catch (err) {
    console.error("[dni] DB error:", err)
    return NextResponse.json({ error: "Error de base de datos", detail: String(err) }, { status: 500 })
  }

  const ordenadas = visitas.sort((a, b) => PRIORIDAD[a.estado] - PRIORIDAD[b.estado])

  if (ordenadas.length === 0) {
    return NextResponse.json(
      { encontrado: false, mensaje: "DNI no registrado en ninguna visita activa" },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }

  return NextResponse.json(
    { encontrado: true, visitas: ordenadas },
    { headers: { "X-RateLimit-Remaining": String(remaining) } }
  )
}
