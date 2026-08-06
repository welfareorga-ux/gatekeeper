-- De tres planes (BASICO/ESTANDAR/PREMIUM) con prueba de 14 días
-- a dos planes sin caducidad: GRATIS y PRO.
--
-- Postgres no permite eliminar valores de un enum en uso, así que hay que
-- crear el tipo nuevo, convertir las filas y recién ahí descartar el viejo.
--
-- Mapeo acordado:
--   BASICO   -> GRATIS   (el plan de entrada pasa a ser el gratuito)
--   ESTANDAR -> PRO
--   PREMIUM  -> PRO

-- ── 1. Tipo nuevo ───────────────────────────────────────────────────────────
CREATE TYPE "PlanType_new" AS ENUM ('GRATIS', 'PRO');

-- ── 2. Convertir la columna, mapeando cada valor antiguo ────────────────────
-- Se quita el DEFAULT primero: apunta al tipo viejo y bloquearía el ALTER.
ALTER TABLE "Condominio" ALTER COLUMN "plan" DROP DEFAULT;

ALTER TABLE "Condominio"
  ALTER COLUMN "plan" TYPE "PlanType_new"
  USING (
    CASE "plan"::text
      WHEN 'BASICO'   THEN 'GRATIS'
      WHEN 'ESTANDAR' THEN 'PRO'
      WHEN 'PREMIUM'  THEN 'PRO'
      ELSE 'GRATIS'
    END
  )::"PlanType_new";

-- ── 3. Reemplazar el tipo ───────────────────────────────────────────────────
DROP TYPE "PlanType";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";

ALTER TABLE "Condominio" ALTER COLUMN "plan" SET DEFAULT 'GRATIS';

-- ── 4. Eliminar el período de prueba ────────────────────────────────────────
-- Ya no existe el trial: el plan GRATIS no caduca. Las cuentas que estaban en
-- prueba pasan a estado "activa" (su plan ya quedó en GRATIS por el paso 2).
UPDATE "Condominio"
   SET "suscripcionEstado" = 'activa'
 WHERE "suscripcionEstado" IN ('trial', 'trial_expirado');

ALTER TABLE "Condominio" DROP COLUMN "trialEndsAt";
