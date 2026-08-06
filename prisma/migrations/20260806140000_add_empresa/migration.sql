-- Empresa: organización a la que pertenece un residente dentro de un mismo
-- edificio (caso coworking / oficinas). La lista la administra el ADMIN de la
-- organización. Es OPCIONAL: hay residentes que no vienen de una empresa.
--
-- Es un modelo tenant-scoped NUEVO, así que además de crear la tabla hay que
-- sumarlo al esquema de Row-Level Security igual que User/Visita/TurnoVigilante/
-- PlantillaVisita. Si se omitiera, quedaría fuera del aislamiento multi-tenant.

-- ── Tabla ───────────────────────────────────────────────────────────────────
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Empresa_condominioId_idx" ON "Empresa"("condominioId");
CREATE INDEX "Empresa_activo_idx" ON "Empresa"("activo");
CREATE UNIQUE INDEX "Empresa_condominioId_nombre_key" ON "Empresa"("condominioId", "nombre");

ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_condominioId_fkey"
    FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Columnas opcionales en User y Visita ────────────────────────────────────
-- Ambas NULL: los datos existentes quedan sin empresa, que es el estado correcto.
ALTER TABLE "User" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Visita" ADD COLUMN "empresaId" TEXT;

CREATE INDEX "Visita_empresaId_idx" ON "Visita"("empresaId");

ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visita" ADD CONSTRAINT "Visita_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Row-Level Security (mismo patrón fail-closed que el resto) ──────────────
--   app.condominio_id   -> solo filas de ese condominio
--   app.bypass_rls='on' -> acceso total (superadmin, cron, seed)
--   ninguna de las dos  -> no se ve nada
ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Empresa" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Empresa";
CREATE POLICY tenant_isolation ON "Empresa"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );

-- El rol de aplicación app_tenant necesita permisos sobre la tabla nueva
-- (los GRANT ON ALL TABLES anteriores no cubren tablas creadas después).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_tenant') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Empresa" TO app_tenant;
  END IF;
END
$$;
