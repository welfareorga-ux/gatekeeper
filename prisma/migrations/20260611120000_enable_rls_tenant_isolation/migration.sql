-- Row-Level Security (RLS) para aislamiento multi-tenant por condominioId.
--
-- Capa 3 (defensa a nivel de base de datos). Complementa el filtrado de la app
-- (lib/tenant.ts: forTenant/withTenant). Aunque una query olvide el filtro o se
-- ejecute SQL crudo, Postgres NO devuelve filas de otro condominio.
--
-- Diseño "fail-closed":
--   - app.condominio_id  -> la transacción solo ve/escribe filas de ese condominio.
--   - app.bypass_rls='on'-> acceso total (rutas legítimamente cross-tenant:
--                           login, registro, cron, webhooks, superadmin, seed).
--   - Sin ninguna de las dos -> NO se ve NADA (deny por defecto).
--
-- La app se conecta como neondb_owner (dueño de las tablas), que por defecto
-- IGNORA RLS -> por eso usamos FORCE ROW LEVEL SECURITY en cada tabla.
--
-- Solo se protegen las 4 tablas con columna condominioId propia. Las tablas por
-- relación (Vehiculo, RegistroIngreso, LogActividad) se acceden siempre vía join
-- a estas (la app filtra por relación) y quedan reforzadas indirectamente.

-- ── User ────────────────────────────────────────────────────────────────────
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "User";
CREATE POLICY tenant_isolation ON "User"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );

-- ── Visita ──────────────────────────────────────────────────────────────────
ALTER TABLE "Visita" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Visita" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Visita";
CREATE POLICY tenant_isolation ON "Visita"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );

-- ── TurnoVigilante ──────────────────────────────────────────────────────────
ALTER TABLE "TurnoVigilante" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TurnoVigilante" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "TurnoVigilante";
CREATE POLICY tenant_isolation ON "TurnoVigilante"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );

-- ── PlantillaVisita ─────────────────────────────────────────────────────────
ALTER TABLE "PlantillaVisita" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlantillaVisita" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "PlantillaVisita";
CREATE POLICY tenant_isolation ON "PlantillaVisita"
  USING (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  )
  WITH CHECK (
    coalesce(current_setting('app.bypass_rls', true), 'off') = 'on'
    OR "condominioId" = current_setting('app.condominio_id', true)
  );
