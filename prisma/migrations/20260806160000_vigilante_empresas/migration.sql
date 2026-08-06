-- Empresas asignadas a un vigilante.
--
-- El residente pertenece a UNA empresa (User.empresaId). El vigilante puede
-- cubrir VARIAS, porque en un mismo edificio conviven distintas oficinas, así
-- que necesita una tabla de unión.
--
-- Es OPCIONAL: un vigilante sin filas aquí ve todas las visitas de la
-- organización, que es el caso normal de un condominio residencial.
--
-- Lleva condominioId denormalizado para poder aplicar RLS igual que al resto de
-- tablas tenant-scoped; una tabla de unión sin esa columna quedaría fuera del
-- aislamiento multi-tenant.

CREATE TABLE "VigilanteEmpresa" (
    "vigilanteId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VigilanteEmpresa_pkey" PRIMARY KEY ("vigilanteId", "empresaId")
);

CREATE INDEX "VigilanteEmpresa_vigilanteId_idx" ON "VigilanteEmpresa"("vigilanteId");
CREATE INDEX "VigilanteEmpresa_empresaId_idx" ON "VigilanteEmpresa"("empresaId");
CREATE INDEX "VigilanteEmpresa_condominioId_idx" ON "VigilanteEmpresa"("condominioId");

-- Al borrar el vigilante o la empresa, la asignación se va con ellos.
ALTER TABLE "VigilanteEmpresa" ADD CONSTRAINT "VigilanteEmpresa_vigilanteId_fkey"
    FOREIGN KEY ("vigilanteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VigilanteEmpresa" ADD CONSTRAINT "VigilanteEmpresa_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VigilanteEmpresa" ADD CONSTRAINT "VigilanteEmpresa_condominioId_fkey"
    FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Row-Level Security (mismo patrón fail-closed que el resto) ──────────────
ALTER TABLE "VigilanteEmpresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VigilanteEmpresa" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "VigilanteEmpresa";
CREATE POLICY tenant_isolation ON "VigilanteEmpresa"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );

-- Los GRANT ON ALL TABLES previos no cubren tablas creadas después.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_tenant') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "VigilanteEmpresa" TO app_tenant;
  END IF;
END
$$;
