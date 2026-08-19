# aifunnel

SaaS AI-first para crear funnels interactivos de conversión sin programar.

> **"Describe tu negocio y tu objetivo. La IA crea tu funnel listo para publicar."**

Ver [PLAN.md](./PLAN.md) para la arquitectura completa, el modelo de datos y el
plan de fases, y [design/identidad-visual.md](./design/identidad-visual.md) para
el design handoff (paleta petróleo sobre marfil, Inter Tight / Inter, y la
especificación de cada pantalla).

## Stack

- **Next.js 16** (App Router) · TypeScript · React 19
- **Tailwind CSS v4** + shadcn/ui (Radix) sobre los tokens de la identidad
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
- ✅ **Fase 4 — Public Funnel Runner**: publicación por snapshot (`FunnelVersion`), URL pública `/f/{slug}` sin login, sesiones con UTM/referrer, respuestas persistidas, resultado calculado server-side, leads validados contra la config, 7 eventos de analytics y rate limiting en endpoints públicos.
- ✅ **Fase 5 — Leads**: tabla con filtros por estado y funnel, detalle con respuestas legibles de la versión que vio el visitante, fuente/UTM, cambio de estado (Nuevo→Contactado→Calificado→Convertido→Perdido), notas internas y eliminación del lead con todos sus datos.
- ✅ **Fase 6 — Analytics**: resumen por funnel, embudo Visitas→Inicios→Completados→Leads→CTA, 4 tasas (conversión, finalización, captura, clic CTA) y abandono por pregunta.
- ✅ **Fase 7 — AI Generator**: onboarding conversacional de 6 pasos, abstracción `AIProvider` (server-side), salida estructurada validada con Zod + reintento con feedback, y creación transaccional del funnel completo. Requiere `ANTHROPIC_API_KEY` en `.env`.
- ✅ **Fase 8 — Templates + Branding**: librería de 5 templates (captación de leads, buscador de producto, buscador de servicio, quiz de autoevaluación, reserva de cita) con seed idempotente, materializador de funnels compartido entre IA y templates, página «Mi Marca» (logo, colores, tipografía, contacto) y aplicación de marca a un funnel tanto al crearlo como de forma retroactiva desde el builder. Modal unificado «¿Cómo quieres empezar?» como punto de entrada único.
- ⏭️ Fase 9 — AI Conversion Advisor.

## Backlog (post-lanzamiento, no MVP)

- **Integración con Google Analytics**: permitir que cada cuenta pegue su propio Measurement ID (en «Mi Marca» o en ajustes del funnel) para que el funnel público inyecte `gtag.js` y los eventos también lleguen a la cuenta de GA del dueño del negocio, además de la analítica propia ya existente. Evaluar después de las pruebas con usuarios reales.
