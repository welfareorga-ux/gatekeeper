import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Las migraciones se aplican con el rol ADMIN (neondb_owner), que puede
    // crear/alterar tablas y políticas. La app en runtime usa app_tenant
    // (sin BYPASSRLS) vía DATABASE_URL. Fallback a DATABASE_URL si no se
    // separan credenciales (compatibilidad).
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
})
