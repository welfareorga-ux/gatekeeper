import "dotenv/config"
import { PrismaClient, Rol, EstadoVisita, PlanType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

/**
 * Condominio de DEMOSTRACIÓN para el crawler login de AdSense.
 *
 * El rastreador de anuncios (Mediapartners-Google) necesita entrar con una
 * cuenta real para poder leer las páginas que viven detrás del login y servir
 * anuncios segmentados ahí dentro. Este seed crea un condominio completo y
 * verosímil —con un mes de historial— para que esas pantallas no se vean
 * vacías cuando las visite.
 *
 * El plan es GRATIS a propósito: es el único que muestra publicidad.
 *
 * Uso:
 *   npx tsx prisma/seed-demo-publico.ts            → crea (idempotente)
 *   npx tsx prisma/seed-demo-publico.ts --borrar   → elimina todo lo creado
 *
 * Corre como dueño de la base con bypass de RLS a nivel de sesión, igual que
 * el resto de seeds del proyecto.
 */

const pool = new Pool({
  connectionString: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL!,
  max: 1,
})
pool.on("connect", (client) => {
  client.query("SET app.bypass_rls = 'on'").catch(() => {})
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Constantes de la demo ───────────────────────────────────────────────────

const NOMBRE_CONDOMINIO = "Residencial Los Jardines (Demo)"
const CLAVE_DEMO = "GatekeeperDemo2026!"

const EMAIL_ADMIN = "demo.admin@gatekeeper-app.org"
const EMAIL_VIGILANTE = "demo.vigilante@gatekeeper-app.org"
const EMAIL_RESIDENTE = "demo.residente@gatekeeper-app.org"

/** Sufijo que marca a TODOS los usuarios de la demo, para poder borrarlos. */
const SUFIJO = "@gatekeeper-app.org"
const PREFIJO = "demo."

// ─── Utilidades ──────────────────────────────────────────────────────────────

function fecha(offsetDias: number, hora: number, minutos = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  d.setHours(hora, minutos, 0, 0)
  return d
}

// ─── Datos de ejemplo ────────────────────────────────────────────────────────

const RESIDENTES = [
  { nombre: "Ana Torres Villanueva", email: EMAIL_RESIDENTE, direccion: "Torre A — Depto 502", telefono: "987654001" },
  { nombre: "Jorge Salazar Mendoza", email: `${PREFIJO}res2${SUFIJO}`, direccion: "Torre A — Depto 301", telefono: "987654002" },
  { nombre: "Rosa Chávez Ninahuanca", email: `${PREFIJO}res3${SUFIJO}`, direccion: "Torre B — Depto 104", telefono: "987654003" },
  { nombre: "Miguel Ángel Paredes", email: `${PREFIJO}res4${SUFIJO}`, direccion: "Torre B — Depto 802", telefono: "987654004" },
  { nombre: "Lucía Fernández Arce", email: `${PREFIJO}res5${SUFIJO}`, direccion: "Torre C — Depto 205", telefono: "987654005" },
  { nombre: "Carlos Huamaní Quispe", email: `${PREFIJO}res6${SUFIJO}`, direccion: "Torre C — Depto 601", telefono: "987654006" },
  { nombre: "Patricia Rojas Béjar", email: `${PREFIJO}res7${SUFIJO}`, direccion: "Torre A — Depto 703", telefono: "987654007" },
]

const VIGILANTES = [
  { nombre: "Luis Ramírez Ccahuana", email: EMAIL_VIGILANTE, telefono: "987655001" },
  { nombre: "Marco Peña Ibarra", email: `${PREFIJO}vig2${SUFIJO}`, telefono: "987655002" },
]

/** Visitantes recurrentes del condominio: proveedores, familia y servicios. */
const VISITANTES = [
  { nombre: "Repartidor — Pedidos Ya", dni: "45889021", motivo: "Entrega de pedido", placa: "M2X-114", marca: "Honda", modelo: "Cargo", color: "Rojo" },
  { nombre: "Sofía Medina Ríos", dni: "41220876", motivo: "Visita familiar", placa: "BQP-338", marca: "Toyota", modelo: "Yaris", color: "Plata" },
  { nombre: "Técnico — Servicio de gas", dni: "09877654", motivo: "Mantenimiento de balón", placa: "AVC-771", marca: "Hyundai", modelo: "H100", color: "Blanco" },
  { nombre: "Jorge Aliaga Tello", dni: "43112009", motivo: "Reunión de trabajo", placa: "D3K-092", marca: "Kia", modelo: "Rio", color: "Negro" },
  { nombre: "Profesora — Clases de piano", dni: "07665412", motivo: "Clase particular", placa: null, marca: null, modelo: null, color: null },
  { nombre: "Repartidor — Farmacia", dni: "46330187", motivo: "Entrega de medicamentos", placa: "M8L-556", marca: "Bajaj", modelo: "Pulsar", color: "Azul" },
  { nombre: "Elena Vargas Ponce", dni: "42009118", motivo: "Visita familiar", placa: "CQR-204", marca: "Suzuki", modelo: "Swift", color: "Gris" },
  { nombre: "Servicio de limpieza", dni: "08123390", motivo: "Limpieza de departamento", placa: null, marca: null, modelo: null, color: null },
  { nombre: "Técnico — Internet", dni: "44557712", motivo: "Instalación de router", placa: "AXT-619", marca: "Nissan", modelo: "NP300", color: "Blanco" },
  { nombre: "Ricardo Núñez Bravo", dni: "40887325", motivo: "Visita social", placa: "F7M-441", marca: "Chevrolet", modelo: "Sail", color: "Rojo" },
  { nombre: "Repartidor — Supermercado", dni: "47110265", motivo: "Entrega de compras", placa: "M4N-873", marca: "Honda", modelo: "Cargo", color: "Verde" },
  { nombre: "Mariana Ortiz Salas", dni: "43668190", motivo: "Visita familiar", placa: "BTR-527", marca: "Volkswagen", modelo: "Gol", color: "Azul" },
]

const ACCIONES_LOG = [
  { accion: "LOGIN", detalle: "Inicio de sesión correcto" },
  { accion: "CREAR_VISITA", detalle: "Registró una visita programada" },
  { accion: "REGISTRAR_INGRESO", detalle: "Registró el ingreso de un visitante" },
  { accion: "REGISTRAR_SALIDA", detalle: "Registró la salida de un visitante" },
  { accion: "INICIAR_TURNO", detalle: "Inició turno de vigilancia" },
  { accion: "FINALIZAR_TURNO", detalle: "Finalizó turno de vigilancia" },
  { accion: "CREAR_USUARIO", detalle: "Dio de alta a un residente" },
  { accion: "EXPORTAR_REPORTE", detalle: "Exportó el reporte mensual a PDF" },
]

// ─── Borrado ─────────────────────────────────────────────────────────────────

async function borrar() {
  const condominio = await prisma.condominio.findFirst({ where: { nombre: NOMBRE_CONDOMINIO } })
  if (!condominio) {
    console.log("ℹ️  No hay condominio de demostración que borrar.")
    return
  }
  const id = condominio.id
  const usuarios = await prisma.user.findMany({ where: { condominioId: id }, select: { id: true } })
  const idsUsuarios = usuarios.map((u) => u.id)
  const visitas = await prisma.visita.findMany({ where: { condominioId: id }, select: { id: true } })
  const idsVisitas = visitas.map((v) => v.id)

  // Orden inverso a las dependencias. Vehiculo cae en cascada con Visita.
  await prisma.registroIngreso.deleteMany({ where: { visitaId: { in: idsVisitas } } })
  await prisma.logActividad.deleteMany({ where: { userId: { in: idsUsuarios } } })
  await prisma.plantillaVisita.deleteMany({ where: { condominioId: id } })
  await prisma.turnoVigilante.deleteMany({ where: { condominioId: id } })
  await prisma.visita.deleteMany({ where: { condominioId: id } })
  await prisma.user.deleteMany({ where: { condominioId: id } })
  await prisma.condominio.delete({ where: { id } })

  console.log(`🗑️  Borrado "${NOMBRE_CONDOMINIO}": ${idsUsuarios.length} usuarios, ${idsVisitas.length} visitas.`)
}

// ─── Creación ────────────────────────────────────────────────────────────────

async function crear() {
  const yaExiste = await prisma.user.findFirst({ where: { email: EMAIL_ADMIN } })
  if (yaExiste) {
    console.log("ℹ️  La demo ya estaba creada. Usa --borrar si quieres regenerarla.")
    return
  }

  const clave = await bcrypt.hash(CLAVE_DEMO, 12)

  const condominio = await prisma.condominio.create({
    data: {
      nombre: NOMBRE_CONDOMINIO,
      direccion: "Av. Los Jardines 480, Santiago de Surco, Lima",
      ruc: "20600011223",
      telefono: "01-4785512",
      email: "administracion@losjardines-demo.pe",
      plan: PlanType.GRATIS, // el plan gratuito es el que muestra publicidad
      activo: true,
    },
  })
  console.log(`✅ Condominio: ${condominio.nombre}`)

  const admin = await prisma.user.create({
    data: {
      nombre: "Carmen Ríos Delgado",
      email: EMAIL_ADMIN,
      password: clave,
      telefono: "987653001",
      rol: Rol.ADMIN,
      condominioId: condominio.id,
      activo: true,
    },
  })

  const vigilantes = []
  for (const v of VIGILANTES) {
    vigilantes.push(
      await prisma.user.create({
        data: {
          nombre: v.nombre,
          email: v.email,
          password: clave,
          telefono: v.telefono,
          rol: Rol.VIGILANTE,
          condominioId: condominio.id,
          activo: true,
        },
      })
    )
  }

  const residentes = []
  for (const r of RESIDENTES) {
    residentes.push(
      await prisma.user.create({
        data: {
          nombre: r.nombre,
          email: r.email,
          password: clave,
          telefono: r.telefono,
          direccion: r.direccion,
          rol: Rol.RESIDENTE,
          condominioId: condominio.id,
          activo: true,
        },
      })
    )
  }
  console.log(`✅ Usuarios: 1 admin, ${vigilantes.length} vigilantes, ${residentes.length} residentes`)

  // ─── Historial de visitas del último mes ───────────────────────────────────
  let salidas = 0
  let dentro = 0
  let pendientes = 0

  // 1) Visitas cerradas de los últimos 30 días.
  for (let i = 0; i < 34; i++) {
    const visitante = VISITANTES[i % VISITANTES.length]
    const residente = residentes[i % residentes.length]
    const vigilante = vigilantes[i % vigilantes.length]
    const dia = -(1 + (i % 29))
    const horaEntrada = 8 + (i % 11)
    const duracion = 1 + (i % 4)

    const visita = await prisma.visita.create({
      data: {
        residenteId: residente.id,
        condominioId: condominio.id,
        nombreVisitante: visitante.nombre,
        dniVisitante: visitante.dni,
        motivoVisita: visitante.motivo,
        fechaProgramada: fecha(dia, horaEntrada),
        horaInicio: fecha(dia, horaEntrada),
        horaFin: fecha(dia, horaEntrada + duracion),
        estado: EstadoVisita.SALIDO,
        esRecurrente: i % 5 === 0,
        vehiculos: visitante.placa
          ? { create: [{ placa: visitante.placa, marca: visitante.marca, modelo: visitante.modelo, color: visitante.color }] }
          : undefined,
      },
      include: { vehiculos: true },
    })

    await prisma.registroIngreso.create({
      data: {
        visitaId: visita.id,
        vehiculoId: visita.vehiculos[0]?.id,
        vigilanteIngresoId: vigilante.id,
        fechaHoraIngreso: fecha(dia, horaEntrada, 5),
        vigilanteSalidaId: vigilante.id,
        fechaHoraSalida: fecha(dia, horaEntrada + duracion, 20),
      },
    })
    salidas++
  }

  // 2) Visitantes que están DENTRO ahora mismo (alimenta la pantalla del vigilante).
  for (let i = 0; i < 3; i++) {
    const visitante = VISITANTES[(i + 2) % VISITANTES.length]
    const residente = residentes[(i + 1) % residentes.length]
    const visita = await prisma.visita.create({
      data: {
        residenteId: residente.id,
        condominioId: condominio.id,
        nombreVisitante: visitante.nombre,
        dniVisitante: visitante.dni,
        motivoVisita: visitante.motivo,
        fechaProgramada: fecha(0, 9 + i),
        horaInicio: fecha(0, 9 + i),
        horaFin: fecha(0, 18),
        estado: EstadoVisita.INGRESADO,
        vehiculos: visitante.placa
          ? { create: [{ placa: visitante.placa, marca: visitante.marca, modelo: visitante.modelo, color: visitante.color }] }
          : undefined,
      },
      include: { vehiculos: true },
    })
    await prisma.registroIngreso.create({
      data: {
        visitaId: visita.id,
        vehiculoId: visita.vehiculos[0]?.id,
        vigilanteIngresoId: vigilantes[0].id,
        fechaHoraIngreso: fecha(0, 9 + i, 12),
      },
    })
    dentro++
  }

  // 3) Visitas anunciadas y aún no llegadas.
  for (let i = 0; i < 5; i++) {
    const visitante = VISITANTES[(i + 6) % VISITANTES.length]
    const residente = residentes[(i + 3) % residentes.length]
    await prisma.visita.create({
      data: {
        residenteId: residente.id,
        condominioId: condominio.id,
        nombreVisitante: visitante.nombre,
        dniVisitante: visitante.dni,
        motivoVisita: visitante.motivo,
        fechaProgramada: fecha(i % 2, 15 + (i % 5)),
        horaInicio: fecha(i % 2, 15 + (i % 5)),
        horaFin: fecha(i % 2, 20),
        estado: EstadoVisita.PENDIENTE,
        vehiculos: visitante.placa
          ? { create: [{ placa: visitante.placa, marca: visitante.marca, modelo: visitante.modelo, color: visitante.color }] }
          : undefined,
      },
    })
    pendientes++
  }
  console.log(`✅ Visitas: ${salidas} cerradas, ${dentro} dentro ahora, ${pendientes} pendientes`)

  // ─── Turnos ────────────────────────────────────────────────────────────────
  for (let d = 1; d <= 6; d++) {
    await prisma.turnoVigilante.create({
      data: {
        vigilanteId: vigilantes[d % vigilantes.length].id,
        condominioId: condominio.id,
        horaInicioTurno: fecha(-d, 7),
        horaFinTurno: fecha(-d, 19),
        activo: false,
      },
    })
  }
  await prisma.turnoVigilante.create({
    data: {
      vigilanteId: vigilantes[0].id,
      condominioId: condominio.id,
      horaInicioTurno: fecha(0, 7),
      activo: true,
    },
  })
  console.log(`✅ Turnos: 6 cerrados + 1 activo`)

  // ─── Plantillas del residente principal ────────────────────────────────────
  const plantillas = [
    { alias: "Mamá", visitante: { nombre: "Sofía Medina Ríos", dni: "41220876", motivo: "Visita familiar" }, vehiculo: { placa: "BQP-338", marca: "Toyota", modelo: "Yaris", color: "Plata" } },
    { alias: "Profesora de piano", visitante: { nombre: "Profesora — Clases de piano", dni: "07665412", motivo: "Clase particular" }, vehiculo: {} },
    { alias: "Limpieza (martes)", visitante: { nombre: "Servicio de limpieza", dni: "08123390", motivo: "Limpieza de departamento" }, vehiculo: {} },
    { alias: "Gas", visitante: { nombre: "Técnico — Servicio de gas", dni: "09877654", motivo: "Mantenimiento de balón" }, vehiculo: { placa: "AVC-771", marca: "Hyundai", modelo: "H100", color: "Blanco" } },
  ]
  for (const p of plantillas) {
    await prisma.plantillaVisita.create({
      data: {
        residenteId: residentes[0].id,
        condominioId: condominio.id,
        nombreAlias: p.alias,
        datosVisitanteJSON: p.visitante,
        datosVehiculoJSON: p.vehiculo,
      },
    })
  }
  console.log(`✅ Plantillas: ${plantillas.length}`)

  // ─── Auditoría ─────────────────────────────────────────────────────────────
  const actores = [admin, ...vigilantes, residentes[0], residentes[1]]
  let logs = 0
  for (let i = 0; i < 24; i++) {
    const a = ACCIONES_LOG[i % ACCIONES_LOG.length]
    await prisma.logActividad.create({
      data: {
        userId: actores[i % actores.length].id,
        accion: a.accion,
        detalle: a.detalle,
        ip: `190.234.${10 + (i % 40)}.${20 + (i % 60)}`,
        timestamp: fecha(-(i % 14), 8 + (i % 10), i % 60),
      },
    })
    logs++
  }
  console.log(`✅ Auditoría: ${logs} registros`)

  console.log("\n🎉 Demo creada.\n")
  console.log(`ADMIN      → ${EMAIL_ADMIN}      / ${CLAVE_DEMO}`)
  console.log(`VIGILANTE  → ${EMAIL_VIGILANTE}  / ${CLAVE_DEMO}`)
  console.log(`RESIDENTE  → ${EMAIL_RESIDENTE}  / ${CLAVE_DEMO}`)
}

// ─── Entrada ─────────────────────────────────────────────────────────────────

const debeBorrar = process.argv.includes("--borrar")

;(debeBorrar ? borrar() : crear())
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
