import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"

/**
 * Empresas de la organización (caso coworking / edificio de oficinas).
 * La lista la administra el ADMIN. Los residentes se asignan a una empresa
 * de forma OPCIONAL.
 */

const crearSchema = z.object({
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  // Los vigilantes también la consultan para filtrar sus búsquedas.
  if (session.user.rol === "RESIDENTE") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin organización asociada" }, { status: 403 })

  const empresas = await withTenant(condominioId, (tx) => tx.empresa.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      activo: true,
      createdAt: true,
      _count: { select: { usuarios: true } },
    },
  }))

  return NextResponse.json(empresas)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin organización asociada" }, { status: 403 })

  const result = crearSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }
  const { nombre } = result.data

  try {
    const empresa = await withTenant(condominioId, async (tx) => {
      const existe = await tx.empresa.findFirst({ where: { nombre } })
      if (existe) throw new Error("DUPLICADA")

      // `forTenant` ya inyecta el condominioId, pero Empresa lo tiene NOT NULL
      // (a diferencia del resto de modelos tenant) y TypeScript lo exige aquí.
      const creada = await tx.empresa.create({
        data: { nombre, condominioId },
        select: { id: true, nombre: true, activo: true, createdAt: true },
      })
      await tx.logActividad.create({
        data: {
          userId: session.user.id,
          accion: "CREAR_EMPRESA",
          detalle: `Empresa creada: ${nombre}`,
        },
      })
      return creada
    })
    return NextResponse.json({ ...empresa, _count: { usuarios: 0 } }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICADA") {
      return NextResponse.json({ error: "Ya existe una empresa con ese nombre" }, { status: 409 })
    }
    console.error("[empresas] error al crear:", err)
    return NextResponse.json({ error: "Error al crear la empresa" }, { status: 500 })
  }
}
