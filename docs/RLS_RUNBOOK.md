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
5. **Levantar la app** apuntando a la rama:
   ```bash
   npm run dev
   ```

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

1. Merge de la rama `feat/rls-tenant-isolation` a `main` (Vercel auto-deploy).
2. En la DB de producción (Neon), aplicar la migración:
   ```bash
   # con DATABASE_URL de PROD
   npx prisma migrate deploy
   ```
   > El código nuevo y la migración deben ir casi juntos: con FORCE RLS activo,
   > el código viejo (sin `withTenant`) vería vacío; y el código nuevo sin la
   > migración funciona igual (solo no tiene la capa DB). Orden recomendado:
   > **desplegar código → aplicar migración** (ventana corta).

## Rollback

Si algo sale mal en producción, desactivar RLS sin perder datos:
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
