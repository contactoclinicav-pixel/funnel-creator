import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // Solo necesaria para `migrate dev` en local (shadow DB de Prisma Postgres);
    // no debe ser obligatoria en producción (generate/migrate deploy no la usan).
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
