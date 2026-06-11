import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { enviarNotificacionSalida } from "@/lib/email"
import { z } from "zod"
import { EstadoVisita } from "@prisma/client"

const schema = z.object({
  visitaId: z.string().min(1),
  notasVigilante: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 422 })
  }

  const { visitaId, notasVigilante } = parsed.data
  const horaSalida = new Date()

  // DB en transacción con contexto de tenant (RLS). Email DESPUÉS, fuera de la tx.
  const result = await withTenant(condominioId, async (tx) => {
    const visita = await tx.visita.findFirst({
      where: { id: visitaId },
      select: {
        estado: true,
        nombreVisitante: true,
        vehiculos: { select: { placa: true }, take: 1 },
        residente: { select: { email: true, nombre: true } },
        condominio: { select: { nombre: true } },
      },
    })

    if (!visita) return { error: NextResponse.json({ error: "Visita no encontrada" }, { status: 404 }) }
    if (visita.estado !== EstadoVisita.INGRESADO) {
      return { error: NextResponse.json(
        { error: `La visita no está dentro (estado: ${visita.estado})` },
        { status: 409 }
      ) }
    }

    const registroAbierto = await tx.registroIngreso.findFirst({
      where: { visitaId, fechaHoraSalida: null },
      orderBy: { fechaHoraIngreso: "desc" },
    })
    if (!registroAbierto) {
      return { error: NextResponse.json({ error: "No hay registro de ingreso abierto" }, { status: 404 }) }
    }

    const registro = await tx.registroIngreso.update({
      where: { id: registroAbierto.id },
      data: {
        fechaHoraSalida: horaSalida,
        vigilanteSalidaId: session.user.id,
        ...(notasVigilante ? { notasVigilante } : {}),
      },
    })

    await tx.visita.update({
      where: { id: visitaId },
      data: { estado: EstadoVisita.SALIDO },
    })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "REGISTRAR_SALIDA",
        detalle: `Salida registrada — Visita: ${visitaId}`,
      },
    })

    return { registro, visita, horaIngreso: registroAbierto.fechaHoraIngreso }
  })

  if ("error" in result) return result.error

  // Envío de email en background — no bloquea la respuesta
  void enviarNotificacionSalida({
    emailResidente: result.visita.residente.email,
    nombreResidente: result.visita.residente.nombre,
    nombreVisitante: result.visita.nombreVisitante,
    placa: result.visita.vehiculos[0]?.placa ?? "",
    condominioNombre: result.visita.condominio?.nombre ?? "",
    horaIngreso: result.horaIngreso,
    horaSalida,
  })

  return NextResponse.json(result.registro)
}
