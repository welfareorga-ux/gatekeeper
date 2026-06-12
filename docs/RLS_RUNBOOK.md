# RLS multi-tenant — Runbook (paso 3)

Aislamiento de condominios a nivel de **base de datos** con Row-Level Security (RLS)
de Postgres. Es la capa 3, encima del filtrado de la app (`lib/tenant.ts`).

> ⚠️ **NO aplicar directo a producción.** Probar primero en una **rama de Neon**
> (copia instantánea de la DB) + preview de Vercel. Recién después promover.

## Cómo funciona

- Migración `prisma/migrations/20260611120000_enable_rls_tenant_isolation/`:
  `ENABLE` + `FORCE ROW LEVEL SECURITY` en **User, Visita, TurnoVigilante,
  PlantillaVisita** (las 4 tablas con `condominioId` propio), con una policy
  `tenant_isolation` por tabla.
- `FORCE` es necesario porque la app se conecta como **`neondb_owner`** (dueño),
  que por defecto se salta RLS.
- Política "fail-closed" (deny por defecto):
  - `app.condominio_id` fijado → solo filas de ese condominio.
  - `app.bypass_rls = 'on'` → acceso total (cross-tenant).
  - sin ninguna → **no se ve nada**.
- `lib/tenant.ts`:
  - `withTenant(condominioId, tx => ...)` → abre una transacción, hace
    `SET LOCAL app.condominio_id` y corre el callback. **Toda ruta/página de un
    condominio** lo usa.
  - `runAsAdmin(tx => ...)` → `SET LOCAL app.bypass_rls='on'`. Solo para login,
    registro, cron, webhooks Culqi, SuperAdmin y el seed.
- Tablas sin `condominioId` (Vehiculo, RegistroIngreso, LogActividad) no tienen
  policy propia; se acceden por join a las protegidas dentro de `withTenant`.

## ⚠️ Rol de aplicación `app_tenant` — OBLIGATORIO

**Sin esto, RLS queda INERTE.** El rol por defecto de Neon, `neondb_owner`, tiene
el atributo `rolbypassrls = true` → **se salta RLS incluso con `FORCE`**. No se
puede quitar (`ALTER ROLE neondb_owner NOBYPASSRLS` → *permission denied*; Neon no
expone superuser). Por eso la app debe conectarse con un rol **sin BYPASSRLS**.

- **`app_tenant`**: `LOGIN`, `NOBYPASSRLS`, sin privilegios de admin, con
  `GRANT SELECT/INSERT/UPDATE/DELETE` en todas las tablas + `USAGE/SELECT` en
  secuencias + `ALTER DEFAULT PRIVILEGES` (para tablas futuras de migraciones).
- **Provisión (SQL, como `neondb_owner` — Neon SQL Editor o psql).** Idempotente:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_tenant') THEN
      CREATE ROLE app_tenant LOGIN PASSWORD '<PASSWORD>'
        NOBYPASSRLS NOSUPERUSER NOCREATEROLE NOCREATEDB;
    ELSE
      ALTER ROLE app_tenant WITH LOGIN PASSWORD '<PASSWORD>';  -- NO* exige superuser
    END IF;
  END $$;

  GRANT USAGE ON SCHEMA public TO app_tenant;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_tenant;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_tenant;
  -- tablas/secuencias futuras (migraciones) accesibles automáticamente:
  ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_tenant;
  ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_tenant;
  ```
  (Equivalente automatizado, no versionado por estar en `scripts/` gitignored:
  `MIGRATE_DATABASE_URL=<admin> APP_DB_PASSWORD=<pass> node scripts/provision-app-role.mjs`.)
- **Separación de credenciales:**
  - `DATABASE_URL` (runtime de la app, en Vercel) → **`app_tenant`**.
  - `MIGRATE_DATABASE_URL` (solo al correr `migrate deploy` / `db:seed`) →
    **`neondb_owner`**. `prisma.config.ts` y los seeds usan
    `MIGRATE_DATABASE_URL ?? DATABASE_URL`.
- Verificado en rama (12 jun 2026): como `app_tenant`, sin setting → 0 filas
  (deny), con `app.condominio_id`=A solo ve A (no la trampa de B), `bypass_rls=on`
  ve todo; smoke test E2E (login admin/vigilante + búsquedas) OK, sin 500s.

## Probar en una rama de Neon

1. **Crear rama** en Neon Console (Branches → New branch desde `main`/producción).
   Copia su connection string (rol `neondb_owner`).
2. **Apuntar local a la rama** (NO tocar el `.env` de prod):
   ```bash
   # .env.local o exportar en la terminal de la prueba
   DATABASE_URL="postgres://neondb_owner:...@...neon.tech/neondb-branch?sslmode=require"
   ```
3. **Aplicar migraciones** (incluye la de RLS):
   ```bash
   npx prisma migrate deploy
   ```
4. **Sembrar datos** (el seed ya activa bypass):
   ```bash
   npm run db:seed        # crea el condominio A "Los Pinos" + usuarios demo
   npm run db:seed-demo   # AGREGA el condominio B "Las Palmeras" (aditivo, idempotente)
   ```
   `db:seed-demo` crea el 2º condominio para la prueba de fugas, con un dato
   distintivo: **placa `ZZZ-999` / DNI `99999999`** que NO existe en A.
   Credenciales B: `adminb@gatekeeper.pe` / `AdminB123!`,
   `vigilanteb@gatekeeper.pe` / `VigilanteB1!`, `residenteb@gatekeeper.pe` / `ResidenteB1!`.
5. **Provisionar el rol `app_tenant`** corriendo el SQL de la sección
   *"Rol de aplicación `app_tenant`"* (como `neondb_owner`).
6. **Levantar la app como `app_tenant`** (NO como neondb_owner, o RLS no aísla):
   ```bash
   # DATABASE_URL = app_tenant ; NEXTAUTH_URL local para login en dev
   DATABASE_URL="postgres://app_tenant:<pass>@HOST/neondb?sslmode=require" \
   NEXTAUTH_URL="http://localhost:3000" npm run dev
   ```
   Atajo de verificación automatizada: con el server arriba,
   `node scripts/smoke-login.mjs` (login admin/vigilante + prueba de aislamiento).

### Matriz de prueba (lo que DEBE pasar)

Funcionalidad básica (que RLS no rompió nada):
- [ ] Login admin / vigilante / residente.
- [ ] Registro de un condominio nuevo (`/registro`) crea condominio + admin.
- [ ] Recuperar contraseña (forgot + reset).
- [ ] Dashboard admin muestra conteos y actividad.
- [ ] Lista de usuarios del admin.
- [ ] Residente: dashboard + crear visita + plantillas.
- [ ] Vigilante: turno (iniciar/finalizar), buscar por placa/DNI/QR, ingreso/salida.
- [ ] Reportes admin (visitas por día/residente, permanencia, vehículos, logs, alertas).
- [ ] SuperAdmin: listar condominios + reset admin password.
- [ ] Cron `GET /api/cron/expirar-visitas` con `Authorization: Bearer <CRON_SECRET>`.
- [ ] Webhook Culqi (cancel/expire/fail/success) actualiza el condominio.

Aislamiento (lo que prueba que RLS funciona) — con **2 condominios A y B**:
- [ ] Login como admin de A: NO aparecen usuarios/visitas/reportes de B.
- [ ] Vigilante de A buscando una placa que solo existe en B → "no encontrado".
- [ ] Intentar cancelar/leer una visita de B por su id estando en A → 404.
- [ ] (SQL directo en la rama, como `neondb_owner`, sin settings):
  ```sql
  SELECT count(*) FROM "Visita";          -- debe dar 0 (deny por defecto)
  SET app.condominio_id = '<id de A>';
  SELECT count(*) FROM "Visita";          -- solo las de A
  SET app.bypass_rls = 'on';
  SELECT count(*) FROM "Visita";          -- todas
  ```

Si algo del primer bloque devuelve vacío/errores 500, casi siempre es una ruta
que toca una tabla con RLS y olvidó `withTenant`/`runAsAdmin`: revisar logs.

## Promover a producción

> ⚠️ **Orden crítico.** Si activas la migración RLS antes de que la app conecte
> como `app_tenant`, no pasa nada (neondb_owner la ignora). El riesgo real es lo
> contrario: cambiar `DATABASE_URL` a `app_tenant` **antes** de provisionar el rol
> y sus grants → la app no puede leer nada. Por eso este orden:

1. **Provisionar `app_tenant` en la DB de PROD** (antes de tocar nada en Vercel):
   correr el SQL de la sección *"Rol de aplicación `app_tenant`"* contra prod
   como `neondb_owner` (Neon SQL Editor).
2. **Aplicar la migración RLS** en prod (sigue inerte hasta que la app use app_tenant):
   ```bash
   MIGRATE_DATABASE_URL="<PROD neondb_owner>" npx prisma migrate deploy
   ```
3. **Merge** `feat/rls-tenant-isolation` → `main` (Vercel auto-deploy del código
   nuevo con `withTenant`/`runAsAdmin`). Aún con `DATABASE_URL=neondb_owner`
   funciona igual (RLS inerte, sin romper).
4. **Cambiar `DATABASE_URL` en Vercel** a la cadena de **`app_tenant`** y
   redeploy. **Recién aquí RLS empieza a aislar de verdad.** Vigilar logs unos
   minutos: si algo quedó sin wrapper, daría pantallas vacías → rollback abajo.
   - (Opcional) Conservar `MIGRATE_DATABASE_URL=neondb_owner` en Vercel para
     futuras migraciones; el runtime no lo usa.

## Rollback

**Más rápido (instantáneo, sin SQL):** volver `DATABASE_URL` en Vercel a la cadena
de **`neondb_owner`** y redeploy → como ese rol tiene BYPASSRLS, RLS queda inerte
y la app vuelve a ver todo. Las policies y la migración siguen aplicadas pero sin
efecto. Ideal si aparece una pantalla vacía por una ruta sin wrapper.

Alternativa a nivel DB (desactivar RLS sin perder datos):
```sql
ALTER TABLE "User" NO FORCE ROW LEVEL SECURITY;            ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Visita" NO FORCE ROW LEVEL SECURITY;          ALTER TABLE "Visita" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TurnoVigilante" NO FORCE ROW LEVEL SECURITY;  ALTER TABLE "TurnoVigilante" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PlantillaVisita" NO FORCE ROW LEVEL SECURITY; ALTER TABLE "PlantillaVisita" DISABLE ROW LEVEL SECURITY;
```
El código con `withTenant`/`runAsAdmin` sigue funcionando con RLS desactivado
(las transacciones y el `SET LOCAL` son inofensivos sin policies). Las policies
quedan creadas pero inertes; para borrarlas: `DROP POLICY tenant_isolation ON "<tabla>";`.

## Futuras tablas

Cualquier modelo nuevo con `condominioId`: añadir su bloque
`ENABLE/FORCE RLS + policy` en una migración y sumarlo a `MODELOS_TENANT` en
`lib/tenant.ts`. Acceso siempre vía `withTenant`.
