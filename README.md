# Gatekeeper — Sistema de Control de Visitas Vehiculares

Plataforma web full-stack para gestión de visitas vehiculares en condominios cerrados (Perú).  
Tres roles: **Residente**, **Vigilante** y **Admin**.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth.js v4 (JWT + roles)
- **Validación**: Zod

---

## Requisitos previos

- Node.js 18+
- Docker Desktop (para PostgreSQL local)
- npm 9+

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd gatekeeper
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y configura al menos:

```env
DATABASE_URL="postgresql://gatekeeper:gatekeeper_secret@localhost:5432/gatekeeper_dev"
NEXTAUTH_SECRET="genera-un-secreto-seguro-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="genera-otro-secreto-para-el-cron"
```

**Para generar `NEXTAUTH_SECRET`:**
```bash
# En Linux/Mac:
openssl rand -base64 32

# En Windows (PowerShell):
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Verifica que el contenedor esté corriendo:
```bash
docker compose ps
```

### 5. Generar el cliente Prisma y ejecutar migraciones

```bash
npm run db:generate
npm run db:migrate
```

> Cuando te pida un nombre para la migración, escribe: `init`

### 6. Poblar la base de datos (seed)

```bash
npm run db:seed
```

Esto crea los usuarios de ejemplo:

| Rol        | Email                      | Contraseña    |
|------------|----------------------------|---------------|
| ADMIN      | admin@gatekeeper.pe        | Admin123!     |
| VIGILANTE  | vigilante1@gatekeeper.pe   | Vigilante1!   |
| VIGILANTE  | vigilante2@gatekeeper.pe   | Vigilante2!   |
| RESIDENTE  | residente1@gatekeeper.pe   | Residente1!   |
| RESIDENTE  | residente2@gatekeeper.pe   | Residente2!   |
| RESIDENTE  | residente3@gatekeeper.pe   | Residente3!   |
| RESIDENTE  | residente4@gatekeeper.pe   | Residente4!   |
| RESIDENTE  | residente5@gatekeeper.pe   | Residente5!   |

### 7. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción

npm run db:generate  # Genera el cliente Prisma
npm run db:migrate   # Ejecuta migraciones (dev)
npm run db:push      # Sincroniza schema sin migración
npm run db:seed      # Puebla la base de datos
npm run db:reset     # Resetea la base de datos (¡destruye datos!)
npm run db:studio    # Abre Prisma Studio (explorador visual)

npm run test:run     # Ejecuta tests con Vitest
npm run test         # Modo watch para desarrollo
```

---

## Estructura del proyecto

```
gatekeeper/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/    # Endpoint NextAuth
│   ├── login/                      # Página de inicio de sesión
│   ├── residente/                  # Módulo residente (Fase 2)
│   ├── vigilante/                  # Módulo vigilante (Fase 3)
│   ├── admin/                      # Módulo admin (Fase 4)
│   └── no-autorizado/              # Página de acceso denegado
├── components/
│   ├── ui/                         # Componentes shadcn/ui
│   └── providers/                  # Proveedores React
├── lib/
│   ├── auth.ts                     # Configuración NextAuth
│   ├── prisma.ts                   # Cliente Prisma singleton
│   ├── utils.ts                    # Utilidades (cn, fechas)
│   └── validations/
│       └── placa.ts                # Validación placas peruanas
├── prisma/
│   ├── schema.prisma               # Schema de base de datos
│   └── seed.ts                     # Datos de ejemplo
├── types/
│   └── next-auth.d.ts              # Tipos extendidos NextAuth
├── middleware.ts                   # Protección de rutas por rol
├── docker-compose.yml              # PostgreSQL local
└── .env.example                    # Variables de entorno
```

---

## Validación de placas peruanas

El sistema valida tres formatos:

| Tipo     | Formato    | Ejemplo   |
|----------|------------|-----------|
| Nueva    | A1B-234    | C3D-456   |
| Antigua  | ABC-123    | XYZ-789   |
| Moto     | A1-2345    | B2-3456   |

El sistema normaliza automáticamente (mayúsculas, guion) en cliente y servidor.

---

## Roles y acceso

| Rol        | Rutas accesibles                           |
|------------|-------------------------------------------|
| RESIDENTE  | `/residente/*`                            |
| VIGILANTE  | `/vigilante/*`                            |
| ADMIN      | `/admin/*`, `/residente/*`, `/vigilante/*` |

---

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Sesiones JWT (duración 8 horas)
- Headers de seguridad: CSP, HSTS, X-Frame-Options, etc.
- Validación server-side con Zod en todos los endpoints
- Logs de auditoría para acciones críticas
- Middleware de protección de rutas basado en rol

> **Producción**: Usar HTTPS obligatorio. Configurar `NEXTAUTH_URL` con el dominio real.

---

## Desarrollo con Docker

```bash
# Levantar solo la base de datos
docker compose up -d

# Ver logs
docker compose logs -f postgres

# Detener
docker compose down

# Detener y eliminar datos
docker compose down -v
```

---

## Cron Job — Expiración automática de visitas

El endpoint `GET /api/cron/expirar-visitas` marca como `EXPIRADO` las visitas `PENDIENTE` cuya `horaFin` tenga más de 4 horas.

**Llamada manual:**
```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/expirar-visitas
```

**Con Vercel Cron** — agregar a `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/expirar-visitas", "schedule": "0 * * * *" }]
}
```

**Con crontab (Linux):**
```
0 * * * * curl -s -H "Authorization: Bearer TU_SECRET" https://tu-dominio.com/api/cron/expirar-visitas
```

---

## PWA — Instalación en móvil

La app es instalable como PWA. Para habilitarla en producción:
1. Crear `public/icons/icon-192.png` (192×192 px) y `public/icons/icon-512.png` (512×512 px)
2. El manifest se sirve automáticamente por Next.js en `/manifest.webmanifest`
3. Shortcuts configurados: "Buscar Vehículo" y "Nueva Visita"

---

## Gestión de la base de datos

```bash
# Ver el schema visual en el navegador
npm run db:studio

# Crear nueva migración tras cambiar schema.prisma
npm run db:migrate

# Resetear todo (dev)
npm run db:reset && npm run db:seed
```
