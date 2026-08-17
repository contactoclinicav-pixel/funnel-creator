# AI Funnel Creator

SaaS AI-first para crear funnels interactivos de conversión sin programar.

> **"Describe tu negocio y tu objetivo. La IA crea tu funnel listo para publicar."**

Ver [PLAN.md](./PLAN.md) para la arquitectura completa, el modelo de datos y el plan de fases.

## Stack

- **Next.js 16** (App Router) · TypeScript · React 19
- **Tailwind CSS v4** + shadcn/ui (Radix)
- **Prisma 7** + PostgreSQL
- **Better Auth** (email + contraseña)
- **Zod** para validación server-side

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
#    Copia .env.example a .env y completa los valores.

# 3. Levantar PostgreSQL local (Prisma Postgres, sin Docker)
npx prisma dev --detach --name funnel-dev

# 4. Aplicar migraciones y generar el cliente
npx prisma migrate dev

# 5. Arrancar la app
npm run dev
```

La app queda en `http://localhost:3000`.

> **Nota (dev):** el enlace de recuperación de contraseña se imprime en la
> consola del servidor mientras no haya proveedor de email configurado.

## Producción

- `DATABASE_URL`: usar un PostgreSQL gestionado (p. ej. Neon). `SHADOW_DATABASE_URL` solo es necesaria con la base local de desarrollo.
- `BETTER_AUTH_SECRET`: generar uno fuerte (`npx @better-auth/cli secret`).
- Las claves de IA (`ANTHROPIC_API_KEY`) viven solo en el servidor; nunca se exponen al frontend.

## Estructura

```
src/
├─ app/            # rutas: (auth), (app) autenticada, f/[slug] pública (próx.)
├─ components/     # ui/ (shadcn), layout/, settings/, brand/
├─ lib/            # db, auth, auth-client, utils
├─ server/         # context (tenancy), services/ (lógica de negocio)
└─ generated/      # cliente Prisma (no editar, ignorado en git)
prisma/            # schema + migraciones
```

## Estado del desarrollo

- ✅ **Fase 1 — Foundation**: proyecto, base de datos, autenticación completa, workspace multi-tenant, layout y navegación, dashboard.
- ✅ **Fase 2 — Funnel CRUD**: crear, editar ajustes, duplicar (copia profunda), archivar/restaurar, eliminar con confirmación, listado con filtros por estado, slugs únicos.
- ✅ **Fase 3 — Builder**: editor por tabs (Diseño, Preguntas, Lógica, Resultados, Leads, CTA), 8 tipos de pregunta, reglas de puntos y saltos, result engine puro compartido, preview interactivo desktop/mobile.
- ⏭️ Fase 4 — Public Funnel Runner (URL pública, sesiones, respuestas, result engine server-side).
