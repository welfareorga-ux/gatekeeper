import "dotenv/config"
import { PrismaClient, Rol, EstadoVisita, PlanType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

// Segundo condominio (B) para PROBAR AISLAMIENTO multi-tenant (RLS).
// A diferencia de seed.ts, este es ADITIVO: NO borra nada, solo agrega el
// condominio "Las Palmeras" con datos DISTINTIVOS (placa/DNI que no existen
// en "Los Pinos"). Corre como dueño con bypass RLS a nivel de sesión.
// Usa el rol ADMIN (MIGRATE_DATABASE_URL=neondb_owner); fallback a DATABASE_URL.
const pool = new Pool({ connectionString: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL!, max: 1 })
pool.on("connect", (client) => {
  client.query("SET app.bypass_rls = 'on'").catch(() => {})
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

function fecha(offsetDias: number, hora: number, minutos = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  d.setHours(hora, minutos, 0, 0)
  return d
}

async function main() {
  console.log("🌱 Seed DEMO (condominio B para prueba de aislamiento)...")

  // Idempotente: si ya existe el admin de B, no duplicar.
  const yaExiste = await prisma.user.findFirst({ where: { email: "adminb@gatekeeper.pe" } })
  if (yaExiste) {
    console.log("ℹ️  El condominio B ya estaba sembrado. Nada que hacer.")
    return
  }

  // ─── Condominio B ──────────────────────────────────────────────────────────
  const condominioB = await prisma.condominio.create({
    data: {
      nombre: "Condominio Las Palmeras",
      direccion: "Calle Las Palmeras 100, Surco, Lima",
      ruc: "20687654321",
      telefono: "01-9876543",
      email: "admin@laspalmeras.pe",
      plan: PlanType.GRATIS,
      activo: true,
    },
  })
  console.log(`✅ Condominio B: ${condominioB.nombre} (${condominioB.id})`)

  const adminB = await prisma.user.create({
    data: {
      nombre: "Administrador Las Palmeras",
      email: "adminb@gatekeeper.pe",
      password: await hashPassword("AdminB123!"),
      telefono: "988000001",
      rol: Rol.ADMIN,
      condominioId: condominioB.id,
      activo: true,
    },
  })
  console.log(`✅ Admin B: ${adminB.email}`)

  const vigilanteB = await prisma.user.create({
    data: {
      nombre: "Pedro Huamán Soto",
      email: "vigilanteb@gatekeeper.pe",
      password: await hashPassword("VigilanteB1!"),
      telefono: "988000101",
      rol: Rol.VIGILANTE,
      condominioId: condominioB.id,
      activo: true,
    },
  })
  console.log(`✅ Vigilante B: ${vigilanteB.email}`)

  const residenteB = await prisma.user.create({
    data: {
      nombre: "Elena Quispe Rojas",
      email: "residenteb@gatekeeper.pe",
      password: await hashPassword("ResidenteB1!"),
      telefono: "988001001",
      rol: Rol.RESIDENTE,
      direccion: "Torre 1 - Depto 301",
      condominioId: condominioB.id,
      activo: true,
    },
  })
  console.log(`✅ Residente B: ${residenteB.email}`)

  // ─── Visita DISTINTIVA de B (placa/DNI únicos para la prueba de fuga) ────────
  // Placa "ZZZ-999" y DNI "99999999" NO existen en "Los Pinos".
  await prisma.visita.create({
    data: {
      residenteId: residenteB.id,
      condominioId: condominioB.id,
      nombreVisitante: "Visitante Secreto B",
      dniVisitante: "99999999",
      motivoVisita: "Solo debe verla el condominio B",
      fechaProgramada: fecha(0, 11),
      horaInicio: fecha(0, 11),
      horaFin: fecha(0, 15),
      estado: EstadoVisita.PENDIENTE,
      esRecurrente: false,
      vehiculos: { create: [{ placa: "ZZZ-999", marca: "Tesla", modelo: "Model 3", color: "Rojo" }] },
    },
  })
  console.log(`✅ Visita B: placa ZZZ-999 / DNI 99999999 (debe ser invisible para A)`)

  await prisma.turnoVigilante.create({
    data: { vigilanteId: vigilanteB.id, condominioId: condominioB.id, horaInicioTurno: new Date(), activo: true },
  })

  console.log("\n🎉 Seed DEMO completado!\n")
  console.log("ADMIN B     → adminb@gatekeeper.pe      / AdminB123!")
  console.log("VIGILANTE B → vigilanteb@gatekeeper.pe  / VigilanteB1!")
  console.log("RESIDENTE B → residenteb@gatekeeper.pe  / ResidenteB1!")
  console.log("Dato de prueba de fuga → placa ZZZ-999 / DNI 99999999")
}

main()
  .catch((e) => { console.error("❌ Error en seed-demo:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
