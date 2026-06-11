import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { forTenant } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { enviarCredencialesUsuario } from "@/lib/email"

const LIMITES_PLAN: Record<string, { residentes: number; vigilantes: number }> = {
  BASICO:   { residentes: 20,         vigilantes: 1          },
  ESTANDAR: { residentes: 50,         vigilantes: 3          },
  PREMIUM:  { residentes: Infinity,   vigilantes: Infinity   },
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const condominioId = session.user.condominioId
  if (!condominioId) return NextResponse.json({ error: "Sin condominio asociado" }, { status: 403 })
  const db = forTenant(condominioId)

  const { searchParams } = new URL(req.url)
  const rol = searchParams.get("rol")
  const buscar = searchParams.get("buscar") ?? ""
  const activoParam = searchParams.get("activo")

  const usuarios = await db.user.findMany({
    where: {
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
  const db = forTenant(condominioId)

  const body = await req.json()
  const result = crearSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { nombre, email, password, rol, telefono, direccion } = result.data

  const condominio = await db.condominio.findUnique({
    where: { id: condominioId },
    select: { plan: true, nombre: true },
  })

  // Verificar límites del plan antes de crear
  if (rol === "RESIDENTE" || rol === "VIGILANTE") {
    const limites = LIMITES_PLAN[condominio?.plan ?? "BASICO"]
    const campo = rol === "RESIDENTE" ? "residentes" : "vigilantes"
    const limite = limites[campo]

    if (limite !== Infinity) {
      const actual = await db.user.count({
        where: { rol: rol as "RESIDENTE" | "VIGILANTE", activo: true },
      })
      if (actual >= limite) {
        const planLabel = condominio?.plan === "BASICO" ? "Básico" : condominio?.plan === "ESTANDAR" ? "Estándar" : "Premium"
        return NextResponse.json({
          error: `Tu plan ${planLabel} permite máximo ${limite} ${campo}. Actualiza tu plan para agregar más.`,
        }, { status: 403 })
      }
    }
  }

  // findUnique global: email es único en toda la plataforma (no por condominio).
  const existe = await db.user.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const usuario = await db.user.create({
    data: { nombre, email, password: hash, rol, telefono, direccion },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  })

  await db.logActividad.create({
    data: {
      userId: session.user.id,
      accion: "CREAR_USUARIO",
      detalle: JSON.stringify({ email, rol }),
    },
  })

  void enviarCredencialesUsuario({
    email,
    nombre,
    password,
    rol,
    condominioNombre: condominio?.nombre ?? "",
  })

  return NextResponse.json(usuario, { status: 201 })
}
