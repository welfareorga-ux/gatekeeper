import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { runAsAdmin } from "@/lib/tenant"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  // Cross-tenant con bypass: el superadmin SÍ puede eliminar administradores
  // (a diferencia del panel admin, que solo los desactiva).
  return runAsAdmin(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: params.id },
      select: { id: true, rol: true, nombre: true, email: true, isSuperAdmin: true, condominioId: true },
    })
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    if (target.isSuperAdmin) {
      return NextResponse.json({ error: "No se puede eliminar a un superadministrador" }, { status: 400 })
    }

    // Cascada manual (las relaciones a User son Restrict): liberar/borrar
    // dependencias antes de borrar el usuario.
    await tx.registroIngreso.updateMany({ where: { vigilanteIngresoId: params.id }, data: { vigilanteIngresoId: null } })
    await tx.registroIngreso.updateMany({ where: { vigilanteSalidaId: params.id }, data: { vigilanteSalidaId: null } })

    await tx.plantillaVisita.deleteMany({ where: { residenteId: params.id } })

    const visitaIds = (await tx.visita.findMany({ where: { residenteId: params.id }, select: { id: true } })).map((v) => v.id)
    if (visitaIds.length > 0) {
      await tx.registroIngreso.deleteMany({ where: { visitaId: { in: visitaIds } } })
    }

    await tx.visita.deleteMany({ where: { residenteId: params.id } })
    await tx.turnoVigilante.deleteMany({ where: { vigilanteId: params.id } })
    await tx.logActividad.deleteMany({ where: { userId: params.id } })
    await tx.user.delete({ where: { id: params.id } })

    // Registro de auditoría a nombre del superadmin (sin condominio).
    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "SUPERADMIN_ELIMINAR_USUARIO",
        detalle: JSON.stringify({ eliminadoId: params.id, nombre: target.nombre, email: target.email, rol: target.rol, condominioId: target.condominioId }),
      },
    })

    return NextResponse.json({ ok: true })
  })
}
