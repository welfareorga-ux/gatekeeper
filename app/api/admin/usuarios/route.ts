import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant, runAsAdmin } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { enviarCredencialesUsuario } from "@/lib/email"

const LIMITES_PLAN: Record<string, { residentes: number; vigilantes: number }> = {
  GRATIS: { residentes: 15,       vigilantes: 1        },
  PRO:    { residentes: Infinity, vigilantes: Infinity },
}

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

  const usuarios = await withTenant(condominioId, (tx) => tx.user.findMany({
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
  }))

  return NextResponse.json(usuarios)
}

const crearSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rol: z.enum(["RESIDENTE", "VIGILANTE", "ADMIN"]),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  // Opcional: solo aplica a edificios con varias empresas (coworking).
  empresaId: z.string().optional().nullable(),
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

  const { nombre, email, password, rol, telefono, direccion, empresaId } = result.data

  // El email es único en TODA la plataforma (no por condominio). El chequeo debe
  // ser global → runAsAdmin (bypass RLS), o un email de otro condominio pasaría
  // el filtro y reventaría en la restricción unique al insertar.
  const existe = await runAsAdmin((tx) => tx.user.findUnique({ where: { email }, select: { id: true } }))
  if (existe) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)

  const out = await withTenant(condominioId, async (tx) => {
    const condominio = await tx.condominio.findUnique({
      where: { id: condominioId },
      select: { plan: true, nombre: true },
    })

    // Verificar límites del plan antes de crear
    if (rol === "RESIDENTE" || rol === "VIGILANTE") {
      const limites = LIMITES_PLAN[condominio?.plan ?? "GRATIS"]
      const campo = rol === "RESIDENTE" ? "residentes" : "vigilantes"
      const limite = limites[campo]

      if (limite !== Infinity) {
        const actual = await tx.user.count({
          where: { rol: rol as "RESIDENTE" | "VIGILANTE", activo: true },
        })
        if (actual >= limite) {
          return { error: NextResponse.json({
            error: `El plan Gratis permite máximo ${limite} ${campo}. Pasa al plan Pro para agregar más.`,
          }, { status: 403 }) }
        }
      }
    }

    // La empresa debe existir y pertenecer a esta organización. El findFirst va
    // dentro de withTenant, así que RLS ya impide referenciar una de otro tenant.
    let empresaValida: string | null = null
    if (empresaId) {
      const empresa = await tx.empresa.findFirst({ where: { id: empresaId }, select: { id: true } })
      if (!empresa) {
        return { error: NextResponse.json({ error: "La empresa seleccionada no existe" }, { status: 400 }) }
      }
      empresaValida = empresa.id
    }

    const usuario = await tx.user.create({
      data: { nombre, email, password: hash, rol, telefono, direccion, empresaId: empresaValida },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    })

    await tx.logActividad.create({
      data: {
        userId: session.user.id,
        accion: "CREAR_USUARIO",
        detalle: JSON.stringify({ email, rol }),
      },
    })

    return { usuario, condominioNombre: condominio?.nombre ?? "" }
  })

  if ("error" in out) return out.error

  void enviarCredencialesUsuario({
    email,
    nombre,
    password,
    rol,
    condominioNombre: out.condominioNombre,
  })

  return NextResponse.json(out.usuario, { status: 201 })
}
