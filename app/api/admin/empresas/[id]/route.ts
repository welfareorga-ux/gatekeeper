import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"

const editarSchema = z.object({
  nombre: z.string().trim().min(2).max(80).optional(),
  activo: z.boolean().optional(),
})

/** PATCH: renombrar o activar/desactivar una empresa. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin organización asociada" }, { status: 403 })

  const result = editarSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  try {
    const empresa = await withTenant(condominioId, async (tx) => {
      // findFirst + verificación de propiedad: `update` por id único no admite
      // condominioId en el where (ver lib/tenant.ts).
      const actual = await tx.empresa.findFirst({ where: { id: params.id } })
      if (!actual) throw new Error("NO_ENCONTRADA")

      if (result.data.nombre && result.data.nombre !== actual.nombre) {
        const dup = await tx.empresa.findFirst({ where: { nombre: result.data.nombre } })
        if (dup) throw new Error("DUPLICADA")
      }

      return tx.empresa.update({
        where: { id: actual.id },
        data: result.data,
        select: { id: true, nombre: true, activo: true },
      })
    })
    return NextResponse.json(empresa)
  } catch (err) {
    if (err instanceof Error && err.message === "NO_ENCONTRADA") {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }
    if (err instanceof Error && err.message === "DUPLICADA") {
      return NextResponse.json({ error: "Ya existe una empresa con ese nombre" }, { status: 409 })
    }
    console.error("[empresas] error al actualizar:", err)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

/**
 * DELETE: elimina la empresa. Los usuarios y visitas asociados NO se borran:
 * su `empresaId` queda en NULL (onDelete: SetNull), es decir, "sin empresa".
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin organización asociada" }, { status: 403 })

  try {
    const res = await withTenant(condominioId, async (tx) => {
      const empresa = await tx.empresa.findFirst({
        where: { id: params.id },
        select: { id: true, nombre: true, _count: { select: { usuarios: true } } },
      })
      if (!empresa) throw new Error("NO_ENCONTRADA")

      await tx.empresa.delete({ where: { id: empresa.id } })
      await tx.logActividad.create({
        data: {
          userId: session.user.id,
          accion: "ELIMINAR_EMPRESA",
          detalle: `Empresa eliminada: ${empresa.nombre} (${empresa._count.usuarios} usuario/s quedaron sin empresa)`,
        },
      })
      return { usuarios: empresa._count.usuarios }
    })
    return NextResponse.json({ ok: true, ...res })
  } catch (err) {
    if (err instanceof Error && err.message === "NO_ENCONTRADA") {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }
    console.error("[empresas] error al eliminar:", err)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
