-- El saldo de visitas extra deja de ser permanente: vence al terminar el mes
-- calendario (hora de Lima) en que se compró.
--
-- `visitasExtraInicio` guarda el inicio de ese mes. Un saldo cuyo inicio no es
-- el del mes en curso ya venció y la aplicación lo trata como cero.
--
-- Arranque: el saldo que hubiera se asigna al mes en curso, para no quitarle a
-- nadie visitas ya pagadas antes de este cambio.

ALTER TABLE "Condominio" ADD COLUMN "visitasExtraInicio" TIMESTAMP(3);

UPDATE "Condominio"
SET "visitasExtraInicio" = (date_trunc('month', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima') AT TIME ZONE 'UTC'
WHERE "visitasExtra" > 0;
