import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { enviarNotificacionIngreso } from "@/lib/email"
import { z } from "zod"
import { EstadoVisita } from "@prisma/client"

const schema = z.object({
  visitaId: z.string().min(1),
  vehiculoId: z.string().min(1).optional(),
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

  const { visitaId, vehiculoId, notasVigilante } = parsed.data
  const horaIngreso = new Date()

  // Toda la lógica de DB ocurre en una transacción con el contexto de tenant
  // (condominioId) fijado para RLS. El email se envía DESPUÉS, fuera de la tx.
  const result = await withTenant(condominioId, async (tx) => {
    const visita = await tx.visita.findFirst({
      where: { id: visitaId },
      select: {
        estado: true,
        nombreVisitante: true,
        vehiculos: { select: { id: true, placa: true } },
        residente: { select: { email: true, nombre: true } },
        condominio: { select: { nombre: true } },
      },
    })

    if (!visita) return { error: NextResponse.json({ error: "Visita no encontrada" }, { status: 404 }) }
    if (visita.estado !== EstadoVisita.PENDIENTE) {
      return { error: NextResponse.json(
        { error: `La visita está en estado ${visita.estado}. Solo se puede registrar ingreso si está PENDIENTE.` },
        { status: 409 }
      ) }
    }

    const vehiculo = vehiculoId ? visita.vehiculos.find((v) => v.id === vehiculoId) : undefined
    if (vehiculoId && !vehiculo) {
      return { error: NextResponse.json({ error: "El vehículo no pertenece a esta visita" }, { status: 400 }) }
    }

    const registro = await tx.registroIngreso.create({
      data: {
        visitaId,
        ...(vehiculoId ? { vehiculoId } : {}),
        vigilanteIngresoId: session.user.id,
        fechaHoraIngreso: horaIngreso,
        notasVigilante: notasVigilante ?? null,
      },
    })

    await tx.visita.update({
      where: { id: visitaId },
      data: { estado: EstadoVisita.INGRESADO },
    })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "REGISTRAR_INGRESO",
        detalle: `Ingreso registrado — Visita: ${visitaId} | Vehículo: ${vehiculoId}`,
      },
    })

    return { registro, visita, placa: vehiculo?.placa ?? "" }
  })

  if ("error" in result) return result.error

  // Envío de email en background — no bloquea la respuesta
  void enviarNotificacionIngreso({
    emailResidente: result.visita.residente.email,
    nombreResidente: result.visita.residente.nombre,
    nombreVisitante: result.visita.nombreVisitante,
    placa: result.placa,
    condominioNombre: result.visita.condominio?.nombre ?? "",
    horaIngreso,
  })

  return NextResponse.json(result.registro, { status: 201 })
}
