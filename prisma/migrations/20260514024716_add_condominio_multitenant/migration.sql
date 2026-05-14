-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('RESIDENTE', 'VIGILANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('PENDIENTE', 'INGRESADO', 'SALIDO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASICO', 'ESTANDAR', 'PREMIUM');

-- CreateTable
CREATE TABLE "Condominio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "ruc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "plan" "PlanType" NOT NULL DEFAULT 'BASICO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'RESIDENTE',
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "condominioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "residenteId" TEXT NOT NULL,
    "condominioId" TEXT,
    "nombreVisitante" TEXT NOT NULL,
    "dniVisitante" TEXT NOT NULL,
    "motivoVisita" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoVisita" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "codigoQR" TEXT NOT NULL,
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "visitaId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "color" TEXT,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroIngreso" (
    "id" TEXT NOT NULL,
    "visitaId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "vigilanteIngresoId" TEXT,
    "fechaHoraIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigilanteSalidaId" TEXT,
    "fechaHoraSalida" TIMESTAMP(3),
    "notasVigilante" TEXT,

    CONSTRAINT "RegistroIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoVigilante" (
    "id" TEXT NOT NULL,
    "vigilanteId" TEXT NOT NULL,
    "condominioId" TEXT,
    "horaInicioTurno" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaFinTurno" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TurnoVigilante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaVisita" (
    "id" TEXT NOT NULL,
    "residenteId" TEXT NOT NULL,
    "condominioId" TEXT,
    "nombreAlias" TEXT NOT NULL,
    "datosVisitanteJSON" JSONB NOT NULL,
    "datosVehiculoJSON" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantillaVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogActividad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "ip" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogActividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Condominio_activo_idx" ON "Condominio"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE INDEX "User_condominioId_idx" ON "User"("condominioId");

-- CreateIndex
CREATE UNIQUE INDEX "Visita_codigoQR_key" ON "Visita"("codigoQR");

-- CreateIndex
CREATE INDEX "Visita_residenteId_idx" ON "Visita"("residenteId");

-- CreateIndex
CREATE INDEX "Visita_condominioId_idx" ON "Visita"("condominioId");

-- CreateIndex
CREATE INDEX "Visita_estado_idx" ON "Visita"("estado");

-- CreateIndex
CREATE INDEX "Visita_fechaProgramada_idx" ON "Visita"("fechaProgramada");

-- CreateIndex
CREATE INDEX "Vehiculo_placa_idx" ON "Vehiculo"("placa");

-- CreateIndex
CREATE INDEX "Vehiculo_visitaId_idx" ON "Vehiculo"("visitaId");

-- CreateIndex
CREATE INDEX "RegistroIngreso_visitaId_idx" ON "RegistroIngreso"("visitaId");

-- CreateIndex
CREATE INDEX "RegistroIngreso_vehiculoId_idx" ON "RegistroIngreso"("vehiculoId");

-- CreateIndex
CREATE INDEX "RegistroIngreso_fechaHoraIngreso_idx" ON "RegistroIngreso"("fechaHoraIngreso");

-- CreateIndex
CREATE INDEX "TurnoVigilante_vigilanteId_idx" ON "TurnoVigilante"("vigilanteId");

-- CreateIndex
CREATE INDEX "TurnoVigilante_condominioId_idx" ON "TurnoVigilante"("condominioId");

-- CreateIndex
CREATE INDEX "TurnoVigilante_activo_idx" ON "TurnoVigilante"("activo");

-- CreateIndex
CREATE INDEX "PlantillaVisita_residenteId_idx" ON "PlantillaVisita"("residenteId");

-- CreateIndex
CREATE INDEX "PlantillaVisita_condominioId_idx" ON "PlantillaVisita"("condominioId");

-- CreateIndex
CREATE INDEX "LogActividad_userId_idx" ON "LogActividad"("userId");

-- CreateIndex
CREATE INDEX "LogActividad_timestamp_idx" ON "LogActividad"("timestamp");

-- CreateIndex
CREATE INDEX "LogActividad_accion_idx" ON "LogActividad"("accion");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "Visita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroIngreso" ADD CONSTRAINT "RegistroIngreso_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "Visita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroIngreso" ADD CONSTRAINT "RegistroIngreso_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroIngreso" ADD CONSTRAINT "RegistroIngreso_vigilanteIngresoId_fkey" FOREIGN KEY ("vigilanteIngresoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroIngreso" ADD CONSTRAINT "RegistroIngreso_vigilanteSalidaId_fkey" FOREIGN KEY ("vigilanteSalidaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoVigilante" ADD CONSTRAINT "TurnoVigilante_vigilanteId_fkey" FOREIGN KEY ("vigilanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoVigilante" ADD CONSTRAINT "TurnoVigilante_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaVisita" ADD CONSTRAINT "PlantillaVisita_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaVisita" ADD CONSTRAINT "PlantillaVisita_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogActividad" ADD CONSTRAINT "LogActividad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
