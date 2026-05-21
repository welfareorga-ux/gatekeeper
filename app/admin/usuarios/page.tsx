import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UsuariosCliente } from "./usuarios-cliente"

export const metadata = { title: "Usuarios — Gatekeeper Admin" }

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  const condominioId = session?.user.condominioId

  const usuarios = await prisma.user.findMany({
    where: { condominioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      rol: true,
      direccion: true,
      activo: true,
      createdAt: true,
    },
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona residentes, vigilantes y administradores.
        </p>
      </div>
      <UsuariosCliente
        usuariosIniciales={usuarios.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
