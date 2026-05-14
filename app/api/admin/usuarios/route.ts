import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const rol = searchParams.get("rol")
  const buscar = searchParams.get("buscar") ?? ""
  const activoParam = searchParams.get("activo")

  const usuarios = await prisma.user.findMany({
    where: {
      condominioId,
      ...(rol && rol !== "TODOS" ? { rol: rol as "RESIDENTE" | "VIGILANTE" | "ADMIN" } : {}),
      ...(activoParam !== null && activoParam !== "" ? { activo: activoParam === "true" } : {}),
      ...(buscar
        ? {
            OR: [
              { nombre: { contains: buscar, mode: "insensitive" } },
              { email: { contains: buscar, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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

  return NextResponse.json(usuarios)
}

const crearSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rol: z.enum(["RESIDENTE", "VIGILANTE", "ADMIN"]),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })

  const body = await req.json()
  const result = crearSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { nombre, email, password, rol, telefono, direccion } = result.data

  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const usuario = await prisma.user.create({
    data: { nombre, email, password: hash, rol, telefono, direccion, condominioId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  })

  await prisma.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "CREAR_USUARIO",
      detalle: JSON.stringify({ email, rol }),
    },
  })

  return NextResponse.json(usuario, { status: 201 })
}
