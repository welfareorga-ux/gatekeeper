import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { plantillaSchema } from "@/lib/validations/visita"

// ─── GET /api/plantillas ──────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const plantillas = await db.plantillaVisita.findMany({
    where: { residenteId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(plantillas)
}

// ─── POST /api/plantillas ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "RESIDENTE" && session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = plantillaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 422 })
  }

  const plantilla = await db.plantillaVisita.create({
    data: {
      residenteId: session.user.id,
      nombreAlias: parsed.data.nombreAlias,
      datosVisitanteJSON: parsed.data.datosVisitanteJSON,
      datosVehiculoJSON: parsed.data.datosVehiculoJSON,
    },
  })

  return NextResponse.json(plantilla, { status: 201 })
}

// ─── DELETE /api/plantillas?id=xxx ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  // findFirst (con tenant inyectado) verifica que la plantilla sea del condominio
  // antes de borrarla por id único.
  const plantilla = await db.plantillaVisita.findFirst({
    where: { id },
    select: { residenteId: true },
  })
  if (!plantilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  if (session.user.rol !== "ADMIN" && plantilla.residenteId !== session.user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  await db.plantillaVisita.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
