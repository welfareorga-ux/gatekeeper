import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { nuevaVisitaSchema } from "@/lib/validations/visita"
import { EstadoVisita } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const { searchParams } = req.nextUrl
  const estado = searchParams.get("estado") as EstadoVisita | null
  const placa = searchParams.get("placa")
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 25

  const residenteFilter = session.user.rol === "ADMIN" ? {} : { residenteId: session.user.id }

  const where = {
    ...residenteFilter,
    ...(estado ? { estado } : {}),
    ...(fechaDesde || fechaHasta ? { fechaProgramada: { ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}), ...(fechaHasta ? { lte: new Date(fechaHasta + "T23:59:59") } : {}) } } : {}),
    ...(placa ? { vehiculos: { some: { placa: { contains: placa.toUpperCase(), mode: "insensitive" as const } } } } : {}),
  }

  const [visitas, total] = await withTenant(condominioId, (tx) => Promise.all([
    tx.visita.findMany({
      where,
      include: {
        vehiculos: true,
        residente: { select: { nombre: true, direccion: true } },
        _count: { select: { registros: true } },
        // Último movimiento en garita: permite al residente ver a qué hora
        // llegó/salió su visitante sin depender del correo de notificación.
        registros: {
          select: { fechaHoraIngreso: true, fechaHoraSalida: true },
          orderBy: { fechaHoraIngreso: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    tx.visita.count({ where }),
  ]))

  return NextResponse.json({ visitas, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "RESIDENTE" && session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo residentes pueden crear visitas" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }) }

  const parsed = nuevaVisitaSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 422 })

  const { nombreVisitante, dniVisitante, motivoVisita, fechaProgramada, horaInicio, horaFin, vehiculos, esRecurrente, guardarComoPlantilla, nombreAlias } = parsed.data

  const [aniof, mesf, diaf] = fechaProgramada.split("-").map(Number)
  const [hiH, hiM] = horaInicio.split(":").map(Number)
  const [hfH, hfM] = horaFin.split(":").map(Number)
  const fechaBase = new Date(aniof, mesf - 1, diaf)
  const fechaInicioFull = new Date(aniof, mesf - 1, diaf, hiH, hiM)
  const fechaFinFull = new Date(aniof, mesf - 1, diaf, hfH, hfM)

  const visita = await withTenant(condominioId, async (tx) => {
    const v = await tx.visita.create({
      data: {
        residenteId: session.user.id,
        nombreVisitante, dniVisitante, motivoVisita,
        fechaProgramada: fechaBase, horaInicio: fechaInicioFull, horaFin: fechaFinFull,
        esRecurrente: esRecurrente ?? false,
        ...(vehiculos.length > 0 ? {
          vehiculos: { create: vehiculos.map((veh) => ({ placa: veh.placa || null, marca: veh.marca || null, modelo: veh.modelo || null, color: veh.color || null })) },
        } : {}),
      },
      include: { vehiculos: true },
    })
    if (guardarComoPlantilla && nombreAlias) {
      await tx.plantillaVisita.create({ data: { residenteId: session.user.id, nombreAlias, datosVisitanteJSON: { nombreVisitante, dniVisitante, motivoVisita }, datosVehiculoJSON: vehiculos } })
    }
    await tx.logActividad.create({ data: { userId: session.user.id, accion: "CREAR_VISITA", detalle: `Visita para ${nombreVisitante}${vehiculos.length > 0 ? ` | ${vehiculos.map((v) => v.placa || "sin placa").join(", ")}` : " | sin vehículo"}` } })
    return v
  })

  return NextResponse.json(visita, { status: 201 })
}
