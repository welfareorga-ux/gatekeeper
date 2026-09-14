import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { PAQUETE_VISITAS } from "@/lib/limites-plan"
import { enviarNotificacionServicioContratado } from "@/lib/email"

const CULQI_BASE = "https://api.culqi.com/v2"

const schema = z.object({ tokenId: z.string().min(1) })

/**
 * POST — compra un paquete de visitas extra (solo plan GRATIS).
 *
 * Orden: primero se cobra y después se abona el saldo. Si el abono falla tras
 * un cobro correcto, se intenta devolver el cobro para no dejar a nadie pagando
 * por visitas que no recibió (mismo criterio que el alta de Pro).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: "Configuración de pagos incompleta" }, { status: 500 })

  const condominio = await withTenant(condominioId, (tx) =>
    tx.condominio.findUnique({ where: { id: condominioId }, select: { plan: true, nombre: true } }),
  )
  if (!condominio) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
  if (condominio.plan !== "GRATIS") {
    return NextResponse.json({ error: "El plan Pro ya no tiene límite de visitas." }, { status: 400 })
  }

  const cobro = await fetch(`${CULQI_BASE}/charges`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: PAQUETE_VISITAS.amount,
      currency_code: "PEN",
      email: session.user.email,
      source_id: parsed.data.tokenId,
      capture: true,
      description: `Paquete de ${PAQUETE_VISITAS.visitas} visitas extra — Gatekeeper`,
    }),
  })
  const datosCobro = await cobro.json().catch(() => ({})) as { id?: string; user_message?: string; merchant_message?: string }
  if (!cobro.ok || !datosCobro.id) {
    console.error("[Culqi] paquete de visitas: /charges falló:", JSON.stringify(datosCobro))
    return NextResponse.json(
      { error: datosCobro.user_message ?? datosCobro.merchant_message ?? "No se pudo procesar el pago" },
      { status: 402 },
    )
  }

  try {
    const saldo = await withTenant(condominioId, async (tx) => {
      const actualizado = await tx.condominio.update({
        where: { id: condominioId },
        data: { visitasExtra: { increment: PAQUETE_VISITAS.visitas } },
        select: { visitasExtra: true },
      })
      await tx.logActividad.create({
        data: {
          userId: session.user.id,
          accion: "COMPRAR_VISITAS_EXTRA",
          detalle: JSON.stringify({ visitas: PAQUETE_VISITAS.visitas, monto: PAQUETE_VISITAS.precioStr, cargo: datosCobro.id }),
        },
      })
      return actualizado.visitasExtra
    })

    void enviarNotificacionServicioContratado({
      nombre: session.user.nombre,
      email: session.user.email,
      servicioNombre: `Paquete de ${PAQUETE_VISITAS.visitas} visitas extra`,
      precio: PAQUETE_VISITAS.precioStr,
      condominioNombre: condominio.nombre,
    })

    return NextResponse.json({ ok: true, visitasExtra: saldo })
  } catch (e) {
    console.error("[visitas-extra] cobro OK pero el abono falló; se devuelve el cargo", datosCobro.id, e)
    const devolucion = await fetch(`${CULQI_BASE}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: PAQUETE_VISITAS.amount, charge_id: datosCobro.id, reason: "solicitud_comprador" }),
    }).catch(() => null)
    if (!devolucion?.ok) {
      console.error("[visitas-extra] ¡la devolución también falló! Revisar a mano el cargo", datosCobro.id)
    }
    return NextResponse.json(
      { error: "No pudimos acreditar el paquete y se anuló el cobro. Intenta de nuevo o escríbenos a soporte@gatekeeper-app.org." },
      { status: 500 },
    )
  }
}
