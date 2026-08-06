import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withTenant, runAsAdmin } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { enviarCredencialesUsuario } from "@/lib/email"

/**
 * Guardarraíl de capacidad, NO un límite comercial.
 *
 * El plan Pro se vende sin límite de residentes y esa promesa se mantiene: este
 * tope existe para que el crecimiento de una sola cuenta no desborde nuestra
 * capacidad de operación y soporte sin que nos enteremos. Cuando una cuenta lo
 * alcanza, se amplía caso por caso.
 *
 * Por eso no se publica en la landing, los términos ni el panel: el admin solo
 * ve un aviso para contactar a soporte si llega ahí.
 */
const TOPE_RESIDENTES_PRO = 300

const LIMITES_PLAN: Record<string, { residentes: number; vigilantes: number }> = {
  GRATIS: { residentes: 15,                  vigilantes: 2        },
  PRO:    { residentes: TOPE_RESIDENTES_PRO, vigilantes: Infinity },
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
      empresaId: true,
      empresa: { select: { nombre: true } },
      empresasVigiladas: { select: { empresaId: true } },
    },
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  }))

  return NextResponse.json(usuarios)
}

const crearSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  // Un administrador solo da de alta residentes y vigilantes. La cuenta
  // principal es una por organización y solo se crea al registrarse; si hace
  // falta traspasarla, el propio admin cambia su email y contraseña.
  rol: z.enum(["RESIDENTE", "VIGILANTE"]),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  // Opcional, solo en edificios con varias empresas (coworking):
  // el RESIDENTE pertenece a una; el VIGILANTE puede cubrir varias.
  empresaId: z.string().optional().nullable(),
  empresaIds: z.array(z.string()).optional(),
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

  const { nombre, email, password, rol, telefono, direccion, empresaId, empresaIds } = result.data

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
          // En Gratis se dice el límite (es parte de la oferta). En Pro NO se
          // menciona ninguna cifra: se deriva a soporte, que lo amplía.
          const mensaje = condominio?.plan === "GRATIS"
            ? `El plan Gratis permite máximo ${limite} ${campo}. Pasa al plan Pro para agregar más.`
            : `Has alcanzado la capacidad asignada a tu cuenta. Escríbenos a soporte@gatekeeper-app.org y la ampliamos.`
          return { error: NextResponse.json({ error: mensaje }, { status: 403 }) }
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

    // Empresas que vigila (solo VIGILANTE). Se validan contra el tenant antes
    // de crear las asignaciones.
    if (rol === "VIGILANTE" && empresaIds && empresaIds.length > 0) {
      const validas = await tx.empresa.findMany({
        where: { id: { in: empresaIds } },
        select: { id: true },
      })
      if (validas.length > 0) {
        await tx.vigilanteEmpresa.createMany({
          data: validas.map((e) => ({
            vigilanteId: usuario.id,
            empresaId: e.id,
            condominioId,
          })),
        })
      }
    }

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
