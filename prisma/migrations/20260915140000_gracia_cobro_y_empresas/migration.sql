-- Periodo de gracia ante un cobro fallido de Pro y conservación temporal de
-- las empresas cuando una organización pasa a Gratis.
--
-- cobroFallidoEn: primer cobro fallido sin resolver. Durante 5 días la cuenta
--   sigue en Pro; si no paga, pasa a Gratis.
-- pasoAGratisEn: cuándo pasó de Pro a Gratis. Sus empresas se conservan 30
--   días por si vuelve a Pro; después se borran.
--
-- Condominio no tiene RLS: no hacen falta GRANT ni policies nuevas.

ALTER TABLE "Condominio"
    ADD COLUMN "cobroFallidoEn" TIMESTAMP(3),
    ADD COLUMN "pasoAGratisEn" TIMESTAMP(3);
