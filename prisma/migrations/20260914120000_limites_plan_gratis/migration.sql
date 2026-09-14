-- Contadores acumulativos para los límites del plan GRATIS
-- (1 administrador, 1 vigilante, 4 residentes, 12 visitas al mes).
--
-- Van en Condominio y no se calculan contando filas porque eliminar un usuario
-- borra la fila (y sus visitas): contar lo que existe hoy permitiría rotar
-- personas o borrar residentes para recuperar cupo.
--
-- Condominio no tiene RLS, así que no hacen falta GRANT ni policies nuevas.

ALTER TABLE "Condominio"
    ADD COLUMN "residentesCreados" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "vigilantesCreados" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "visitasMes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "visitasMesInicio" TIMESTAMP(3);

-- Punto de partida: los usuarios que existen hoy (activos o no). Del pasado
-- borrado no queda rastro fiable, así que se parte de aquí.
UPDATE "Condominio" c SET
    "residentesCreados" = (SELECT COUNT(*) FROM "User" u WHERE u."condominioId" = c."id" AND u."rol" = 'RESIDENTE'),
    "vigilantesCreados" = (SELECT COUNT(*) FROM "User" u WHERE u."condominioId" = c."id" AND u."rol" = 'VIGILANTE');

-- Visitas del mes en curso, con el mes medido en hora de Lima.
WITH mes AS (
    SELECT (date_trunc('month', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima') AT TIME ZONE 'UTC' AS inicio
)
UPDATE "Condominio" c SET
    "visitasMesInicio" = mes.inicio,
    "visitasMes" = (SELECT COUNT(*) FROM "Visita" v WHERE v."condominioId" = c."id" AND v."createdAt" >= mes.inicio)
FROM mes;
