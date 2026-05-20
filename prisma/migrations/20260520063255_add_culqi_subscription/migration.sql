-- AlterTable
ALTER TABLE "Condominio" ADD COLUMN     "culqiSubscriptionId" TEXT,
ADD COLUMN     "suscripcionEstado" TEXT NOT NULL DEFAULT 'activa';
