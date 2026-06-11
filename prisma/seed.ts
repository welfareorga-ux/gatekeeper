import "dotenv/config"
import { PrismaClient, Rol, EstadoVisita, PlanType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

// max:1 + bypass RLS a nivel de sesión: el seed corre como dueño y necesita
// crear/borrar filas de todos los condominios (incl. SuperAdmin con condominioId NULL).
const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 })
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
  console.log("🌱 Iniciando seed...")

  await prisma.logActividad.deleteMany()
  await prisma.registroIngreso.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.visita.deleteMany()
  await prisma.plantillaVisita.deleteMany()
  await prisma.turnoVigilante.deleteMany()
  await prisma.user.deleteMany()
  await prisma.condominio.deleteMany()

  // ─── Super Admin (sin condominio) ────────────────────────────────────────────

  const superAdmin = await prisma.user.create({
    data: {
      nombre: "Super Administrador",
      email: "superadmin@gatekeeper.pe",
      password: await hashPassword("SuperAdmin1!"),
      rol: Rol.ADMIN,
      isSuperAdmin: true,
      activo: true,
    },
  })
  console.log(`✅ SuperAdmin: ${superAdmin.email}`)

  // ─── Condominio demo ─────────────────────────────────────────────────────────

  const condominio = await prisma.condominio.create({
    data: {
      nombre: "Residencial Los Pinos",
      direccion: "Av. Los Pinos 450, San Borja, Lima",
      ruc: "20612345678",
      telefono: "01-4567890",
      email: "admin@lospinos.pe",
      plan: PlanType.ESTANDAR,
      activo: true,
    },
  })
  console.log(`✅ Condominio: ${condominio.nombre}`)

  // ─── Admin del condominio ────────────────────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      nombre: "Administrador Los Pinos",
      email: "admin@gatekeeper.pe",
      password: await hashPassword("Admin123!"),
      telefono: "999000001",
      rol: Rol.ADMIN,
      condominioId: condominio.id,
      activo: true,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // ─── Vigilantes ──────────────────────────────────────────────────────────────

  const vigilante1 = await prisma.user.create({
    data: {
      nombre: "Carlos Quispe Mamani",
      email: "vigilante1@gatekeeper.pe",
      password: await hashPassword("Vigilante1!"),
      telefono: "999000101",
      rol: Rol.VIGILANTE,
      condominioId: condominio.id,
      activo: true,
    },
  })

  const vigilante2 = await prisma.user.create({
    data: {
      nombre: "José Condori Torres",
      email: "vigilante2@gatekeeper.pe",
      password: await hashPassword("Vigilante2!"),
      telefono: "999000102",
      rol: Rol.VIGILANTE,
      condominioId: condominio.id,
      activo: true,
    },
  })
  console.log(`✅ Vigilantes: ${vigilante1.email}, ${vigilante2.email}`)

  // ─── Residentes ──────────────────────────────────────────────────────────────

  const residentes = await Promise.all([
    prisma.user.create({ data: { nombre: "María García López", email: "residente1@gatekeeper.pe", password: await hashPassword("Residente1!"), telefono: "999001001", rol: Rol.RESIDENTE, direccion: "Manzana A - Lote 12", condominioId: condominio.id, activo: true } }),
    prisma.user.create({ data: { nombre: "Roberto Silva Paredes", email: "residente2@gatekeeper.pe", password: await hashPassword("Residente2!"), telefono: "999001002", rol: Rol.RESIDENTE, direccion: "Manzana B - Lote 5", condominioId: condominio.id, activo: true } }),
    prisma.user.create({ data: { nombre: "Ana Flores Huanca", email: "residente3@gatekeeper.pe", password: await hashPassword("Residente3!"), telefono: "999001003", rol: Rol.RESIDENTE, direccion: "Manzana C - Lote 8", condominioId: condominio.id, activo: true } }),
    prisma.user.create({ data: { nombre: "Luis Mamani Chura", email: "residente4@gatekeeper.pe", password: await hashPassword("Residente4!"), telefono: "999001004", rol: Rol.RESIDENTE, direccion: "Manzana A - Lote 3", condominioId: condominio.id, activo: true } }),
    prisma.user.create({ data: { nombre: "Carmen Ramos Vidal", email: "residente5@gatekeeper.pe", password: await hashPassword("Residente5!"), telefono: "999001005", rol: Rol.RESIDENTE, direccion: "Manzana D - Lote 1", condominioId: condominio.id, activo: true } }),
  ])
  console.log(`✅ Residentes: ${residentes.length} creados`)

  // ─── Visitas con condominioId ─────────────────────────────────────────────────

  const visitasData = [
    { residenteId: residentes[0].id, condominioId: condominio.id, nombreVisitante: "Pedro Gonzales Ruiz", dniVisitante: "45678901", motivoVisita: "Visita familiar", fechaProgramada: fecha(0, 10), horaInicio: fecha(0, 10), horaFin: fecha(0, 14), estado: EstadoVisita.PENDIENTE, placa: "A1B-234", marca: "Toyota", modelo: "Yaris", color: "Blanco" },
    { residenteId: residentes[0].id, condominioId: condominio.id, nombreVisitante: "Sofía Medina Castro", dniVisitante: "12345678", motivoVisita: "Servicio técnico - electricista", fechaProgramada: fecha(0, 9), horaInicio: fecha(0, 9), horaFin: fecha(0, 12), estado: EstadoVisita.INGRESADO, placa: "ABC-123", marca: "Nissan", modelo: "Sentra", color: "Gris" },
    { residenteId: residentes[1].id, condominioId: condominio.id, nombreVisitante: "Marco Vargas León", dniVisitante: "87654321", motivoVisita: "Visita de negocios", fechaProgramada: fecha(0, 8), horaInicio: fecha(0, 8), horaFin: fecha(0, 11), estado: EstadoVisita.SALIDO, placa: "D2E-567", marca: "Hyundai", modelo: "Accent", color: "Negro" },
    { residenteId: residentes[1].id, condominioId: condominio.id, nombreVisitante: "Lucía Ríos Palomino", dniVisitante: "23456789", motivoVisita: "Entrega de paquete", fechaProgramada: fecha(1, 10), horaInicio: fecha(1, 10), horaFin: fecha(1, 11), estado: EstadoVisita.PENDIENTE, placa: "FGH-456", marca: "Kia", modelo: "Picanto", color: "Rojo" },
    { residenteId: residentes[2].id, condominioId: condominio.id, nombreVisitante: "Diego Torres Aguilar", dniVisitante: "34567890", motivoVisita: "Reunión de trabajo", fechaProgramada: fecha(-1, 14), horaInicio: fecha(-1, 14), horaFin: fecha(-1, 17), estado: EstadoVisita.SALIDO, placa: "B3C-789", marca: "Honda", modelo: "Civic", color: "Azul" },
    { residenteId: residentes[3].id, condominioId: condominio.id, nombreVisitante: "Isabella Campos Vera", dniVisitante: "78901234", motivoVisita: "Visita médica domiciliaria", fechaProgramada: fecha(0, 15), horaInicio: fecha(0, 15), horaFin: fecha(0, 17), estado: EstadoVisita.PENDIENTE, placa: "LMN-012", marca: "Volkswagen", modelo: "Gol", color: "Blanco" },
    { residenteId: residentes[4].id, condominioId: condominio.id, nombreVisitante: "Sebastián Luna Pinto", dniVisitante: "89012345", motivoVisita: "Instalación de internet", fechaProgramada: fecha(1, 9), horaInicio: fecha(1, 9), horaFin: fecha(1, 13), estado: EstadoVisita.PENDIENTE, placa: "E5F-345", marca: "Mitsubishi", modelo: "L200", color: "Blanco" },
  ]

  for (const v of visitasData) {
    const { placa, marca, modelo, color, condominioId: cid, ...visitaFields } = v
    await prisma.visita.create({
      data: {
        ...visitaFields,
        condominioId: cid,
        esRecurrente: false,
        vehiculos: { create: [{ placa, marca, modelo, color }] },
      },
    })
  }
  console.log(`✅ Visitas: ${visitasData.length} creadas`)

  // ─── Turno activo ────────────────────────────────────────────────────────────

  await prisma.turnoVigilante.create({
    data: { vigilanteId: vigilante1.id, condominioId: condominio.id, horaInicioTurno: new Date(), activo: true },
  })
  console.log(`✅ Turno activo: ${vigilante1.nombre}`)

  // ─── Log inicial ─────────────────────────────────────────────────────────────

  await prisma.logActividad.create({
    data: { userId: admin.id, accion: "SEED", detalle: "Base de datos inicializada" },
  })

  console.log("\n🎉 Seed completado!\n")
  console.log("SUPERADMIN  → superadmin@gatekeeper.pe / SuperAdmin1!")
  console.log("ADMIN       → admin@gatekeeper.pe      / Admin123!")
  console.log("VIGILANTE   → vigilante1@gatekeeper.pe / Vigilante1!")
  console.log("RESIDENTE   → residente1@gatekeeper.pe / Residente1!")
  console.log("            → residente2..5@gatekeeper.pe / Residente2!..5!")
}

main()
  .catch((e) => { console.error("❌ Error en seed:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
