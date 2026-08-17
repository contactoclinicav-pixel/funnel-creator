# AI Funnel Creator — Arquitectura y Plan de Implementación

> Documento de referencia generado antes de escribir código (Tarea 1 del Prompt Maestro).
> Fecha: 2026-08-16 · Entorno: Windows 11, Node v24.15.0, npm 11.12.1, git 2.54
> Estado del repositorio: vacío (greenfield). No hay PostgreSQL, Docker ni pnpm instalados localmente.

---

## A. Arquitectura propuesta

### Stack

| Capa | Elección | Justificación |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript + React 19** | Full-stack en un solo proyecto, Server Components para el runner público (rápido, mobile-first), API routes/Server Actions para backend. |
| Estilos / UI | **Tailwind CSS v4 + shadcn/ui** | Preferencia declarada; estética SaaS premium con poco esfuerzo. |
| ORM | **Prisma** | Preferencia declarada. |
| Base de datos | **PostgreSQL** (hosted — ver Decisión 1) | Preferencia declarada; no hay Postgres local ni Docker, así que se propone Neon (serverless, free tier). |
| Autenticación | **Better Auth** (alternativa: Auth.js/NextAuth v5 — ver Decisión 2) | Email+password, reset de contraseña y gestión de sesiones nativos, integración Prisma, sin la fricción del Credentials provider de NextAuth. |
| IA | Abstracción **`AIProvider`** propia; implementación inicial: Anthropic API (`claude-sonnet-5`) con salida estructurada validada por **Zod** | Server-side only. Cambiar de proveedor = una clase nueva. |
| Validación | **Zod** en todos los boundaries (formularios, API, salida de IA) | Validación server-side exigida por la sección 20. |
| Analytics | Tabla propia `AnalyticsEvent` + agregaciones SQL | Sin dependencias externas (sección 21). |
| Rate limiting | Middleware propio con ventana deslizante respaldado en DB para endpoints públicos | Sin dependencia externa en MVP; intercambiable por Upstash/Redis después. |

### Capas (separación exigida en sección 23)

```
UI (app/, components/)          → sólo presentación + llamadas a acciones
Server Actions / API routes     → auth check + validación Zod + delegar a servicios
Services (server/services/)     → lógica de negocio; TODA función recibe workspaceId
Result Engine (server/result-engine/) → puro, sin UI ni DB directa: (answers, rules, profiles) → resultado
AI (server/ai/)                 → AIProvider interface + prompts + schema Zod + retry
Data (lib/db.ts + Prisma)       → acceso a datos
Analytics (server/analytics/)   → registro y agregación de eventos
```

### Multitenancy (sección 19)

- Toda entidad comercial cuelga de `workspaceId` (directa o transitivamente por FK).
- Regla de oro en la capa de servicios: **ninguna query sin `workspaceId` en el WHERE**. Los servicios reciben un `ctx = { userId, workspaceId }` resuelto server-side desde la sesión — nunca desde el cliente.
- Los endpoints públicos (`/f/{slug}`, sesiones, eventos) resuelven el workspace a partir del funnel publicado, jamás desde input del visitante.

### Modelo de publicación (versionado)

- El builder edita siempre el **draft** (tablas relacionales: Question, LogicRule, ResultProfile…).
- **Publicar = compilar un snapshot inmutable** en `FunnelVersion` (JSON completo del funnel). El runner público lee sólo la última versión publicada → 1 sola query, respuestas siempre consistentes con la versión que vio el visitante, y editar el draft nunca rompe sesiones en curso.
- `ResponseSession` guarda `funnelVersionId` para saber exactamente qué vio cada visitante.

### Runner público (`/f/{slug}`)

- Ruta pública sin login, SSR + hidratación mínima, mobile-first.
- `visitorId` anónimo en cookie/localStorage; sesión de respuesta creada server-side.
- Captura UTM + referrer al crear la sesión.
- Eventos (`funnel_view`, `funnel_start`, `question_answered`, `funnel_completed`, `lead_created`, `result_viewed`, `cta_clicked`) se registran vía endpoint público con rate limiting y validación estricta.

### Generación con IA (sección 6)

1. Onboarding conversacional (6 pasos) → objeto `GenerationBrief`.
2. Server action llama a `AIProvider.generateFunnel(brief)` → JSON según schema.
3. **Zod valida el JSON completo** (incluye coherencia: cada regla de lógica apunta a preguntas/perfiles existentes, órdenes únicos, etc.).
4. Si falla la validación → 1 reintento automático con el error como feedback al modelo → si vuelve a fallar, error claro al usuario con botón "Reintentar". **Nunca se persiste un funnel incompleto.**
5. Si valida → se crea el funnel en tablas relacionales dentro de una transacción.

---

## B. Modelo de datos (borrador Prisma)

Criterio aplicado (sección 18): lo que se consulta con frecuencia (preguntas, opciones, reglas, perfiles, leads, respuestas, eventos) es **relacional**; lo puramente presentacional o inmutable (theme, intro, snapshot de versión, metadata de evento) es JSON.

```prisma
// ── Identidad y tenancy ────────────────────────────────
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String            // gestionado por la lib de auth
  emailVerified DateTime?
  image         String?
  memberships   WorkspaceMember[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  createdBy String
  members   WorkspaceMember[]
  funnels   Funnel[]
  leads     Lead[]
  brand     BrandSettings?
  events    AnalyticsEvent[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        MemberRole @default(OWNER)   // OWNER | ADMIN | EDITOR | VIEWER
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  @@unique([workspaceId, userId])
}

model BrandSettings {
  id             String  @id @default(cuid())
  workspaceId    String  @unique
  businessName   String?
  logoUrl        String?
  primaryColor   String?
  secondaryColor String?
  font           String?
  website        String?
  whatsapp       String?
  email          String?
  workspace      Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  updatedAt      DateTime @updatedAt
}

// ── Funnel (draft editable) ────────────────────────────
model Funnel {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  slug        String   @unique          // global: la URL pública es /f/{slug}
  status      FunnelStatus @default(DRAFT)  // DRAFT | PUBLISHED | ARCHIVED
  goal        String?
  industry    String?
  audience    String?
  intro       Json?     // { headline, subheadline, buttonText }
  theme       Json?     // colores, tipografía, fondo, botones, logo
  leadCapture Json?     // { fields[], position: before|after, consent{} }
  cta         Json?     // { type, label, value, whatsappMessage }
  createdBy   String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  questions   Question[]
  logicRules  LogicRule[]
  profiles    ResultProfile[]
  versions    FunnelVersion[]
  sessions    ResponseSession[]
  leads       Lead[]
  events      AnalyticsEvent[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([workspaceId, status])
}

model FunnelVersion {
  id            String   @id @default(cuid())
  funnelId      String
  versionNumber Int
  snapshot      Json     // funnel compilado completo e inmutable
  publishedAt   DateTime @default(now())
  createdBy     String
  funnel        Funnel   @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  @@unique([funnelId, versionNumber])
}

model Question {
  id          String  @id @default(cuid())
  funnelId    String
  type        QuestionType // SINGLE_CHOICE | MULTI_CHOICE | YES_NO | SCALE | TEXT | NUMBER | EMAIL | PHONE
  title       String
  description String?
  required    Boolean @default(true)
  order       Int
  settings    Json?   // p.ej. escala min/max/labels
  funnel      Funnel  @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  options     QuestionOption[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([funnelId, order])
}

model QuestionOption {
  id         String  @id @default(cuid())
  questionId String
  label      String
  value      String
  order      Int
  imageUrl   String?          // preparado para respuestas con imagen (futuro)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}

model LogicRule {
  id               String  @id @default(cuid())
  funnelId         String
  questionId       String
  optionId         String?          // condición: respuesta = esta opción
  action           LogicAction      // ADD_SCORE | GOTO_QUESTION
  targetProfileId  String?          // para ADD_SCORE
  points           Int?
  targetQuestionId String?          // para GOTO_QUESTION
  funnel           Funnel @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  @@index([funnelId, questionId])
}

model ResultProfile {
  id             String  @id @default(cuid())
  funnelId       String
  key            String            // slug interno estable para scoring
  title          String
  description    String?
  recommendation String?
  imageUrl       String?
  ctaOverride    Json?             // CTA específico del perfil (opcional)
  order          Int
  funnel         Funnel @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  @@unique([funnelId, key])
}

// ── Runtime del visitante ──────────────────────────────
model ResponseSession {
  id              String   @id @default(cuid())
  funnelId        String
  funnelVersionId String
  visitorId       String            // anónimo, cookie/localStorage
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  scores          Json?             // { profileKey: puntos }
  resultProfileId String?
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  referrer        String?
  funnel          Funnel   @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  answers         Answer[]
  lead            Lead?
  @@index([funnelId, startedAt])
}

model Answer {
  id         String   @id @default(cuid())
  sessionId  String
  questionId String            // id dentro del snapshot de la versión
  value      Json              // texto | número | optionId[] según tipo
  createdAt  DateTime @default(now())
  session    ResponseSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@index([sessionId])
}

model Lead {
  id              String   @id @default(cuid())
  workspaceId     String
  funnelId        String
  sessionId       String?  @unique
  name            String?
  email           String?
  phone           String?
  city            String?
  consent         Boolean  @default(false)
  status          LeadStatus @default(NEW) // NEW | CONTACTED | QUALIFIED | CONVERTED | LOST
  resultProfileId String?
  ctaClicked      String?
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  funnel          Funnel    @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  session         ResponseSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  notes           LeadNote[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([workspaceId, status])
  @@index([funnelId])
}

model LeadNote {
  id        String   @id @default(cuid())
  leadId    String
  authorId  String
  body      String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

// ── Analytics ──────────────────────────────────────────
model AnalyticsEvent {
  id          String   @id @default(cuid())
  workspaceId String
  funnelId    String
  sessionId   String?
  type        EventType // FUNNEL_VIEW | FUNNEL_START | QUESTION_ANSWERED | FUNNEL_COMPLETED | LEAD_CREATED | RESULT_VIEWED | CTA_CLICKED
  questionId  String?
  metadata    Json?
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  funnel      Funnel    @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  @@index([funnelId, type, createdAt])
}

// ── Templates ──────────────────────────────────────────
model Template {
  id          String  @id @default(cuid())
  name        String
  description String?
  category    String
  config      Json    // misma forma que el snapshot de FunnelVersion
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Notas:
- La librería de auth (Better Auth) añade sus propias tablas (Session, Account, Verification) vía su adaptador Prisma.
- Eliminación de datos personales (sección 20): borrar un Lead / ResponseSession cascada a Answers y Notes; se añadirá acción "Eliminar lead y sus datos" en Fase 5.
- El abandono por pregunta (sección 14) se calcula desde `QUESTION_ANSWERED` agrupado por `questionId` — sin tablas extra. Esto deja listos los datos para el AI Conversion Advisor (Fase 9).

---

## C. Estructura del proyecto

```
funnel-creator/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                      # templates iniciales + usuario demo (solo dev)
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/ · register/ · forgot-password/ · reset-password/
│  │  ├─ (app)/                    # shell autenticado: sidebar + topbar
│  │  │  ├─ dashboard/
│  │  │  ├─ funnels/               # listado
│  │  │  │  └─ [funnelId]/edit/    # builder (tabs: Diseño·Preguntas·Lógica·Resultados·Leads·CTA) + preview
│  │  │  ├─ create-ai/             # onboarding conversacional 6 pasos
│  │  │  ├─ templates/
│  │  │  ├─ leads/  └─ [leadId]/
│  │  │  ├─ analytics/
│  │  │  ├─ integrations/          # placeholder
│  │  │  ├─ brand/
│  │  │  └─ settings/
│  │  ├─ f/[slug]/                 # runner público (sin login, mobile-first)
│  │  ├─ api/
│  │  │  ├─ auth/[...all]/         # handler de la lib de auth
│  │  │  └─ public/                # sessions, answers, events, leads (rate-limited)
│  │  ├─ layout.tsx · page.tsx     # landing mínima
│  ├─ components/
│  │  ├─ ui/                       # shadcn
│  │  ├─ layout/                   # sidebar, topbar, shell
│  │  ├─ dashboard/ · builder/ · runner/ · leads/ · analytics/
│  ├─ lib/
│  │  ├─ db.ts · auth.ts · auth-client.ts · utils.ts · rate-limit.ts
│  │  └─ validators/               # schemas Zod compartidos
│  ├─ server/
│  │  ├─ services/                 # funnel.ts, workspace.ts, lead.ts, analytics.ts, template.ts
│  │  ├─ ai/
│  │  │  ├─ provider.ts            # interface AIProvider
│  │  │  ├─ anthropic-provider.ts
│  │  │  ├─ prompts/
│  │  │  └─ funnel-schema.ts       # Zod schema de la salida de IA
│  │  └─ result-engine/
│  │     ├─ engine.ts              # puro: (version, answers) → { scores, profile }
│  │     └─ engine.test.ts
│  └─ types/
├─ .env.example
├─ middleware.ts                    # protección de rutas (app) + headers
└─ PLAN.md (este documento)
```

---

## D. Plan de implementación — FASE 1 desglosada

| # | Tarea | Resultado verificable |
|---|---|---|
| 1.1 | `git init` + scaffold Next.js 15 + TS + Tailwind + shadcn/ui + estructura de carpetas + `.env.example` | `npm run build` pasa |
| 1.2 | Conexión a PostgreSQL + Prisma + schema base (User, Workspace, WorkspaceMember, BrandSettings + tablas auth) + migración inicial | `prisma migrate dev` aplica; `prisma studio` muestra tablas |
| 1.3 | Autenticación: registro, login, logout, sesión | Flujo completo manual en navegador |
| 1.4 | Recuperación de contraseña (en dev: enlace por consola/log; producción: proveedor de email — Decisión 4) | Reset funcional end-to-end en dev |
| 1.5 | Workspace: creación automática al registrarse + helper `requireWorkspace()` que resuelve `{ userId, workspaceId }` server-side | Todo request autenticado tiene ctx de tenant |
| 1.6 | Shell de la app: sidebar (9 secciones del menú, placeholders marcados), topbar con perfil, responsive | Navegación completa en desktop y mobile |
| 1.7 | Dashboard con tarjetas de métricas (estados vacíos honestos, sin datos mock permanentes) + botón "+ Crear Funnel" | Dashboard renderiza con datos reales (ceros) |
| 1.8 | Página de perfil (nombre, email, contraseña) + página Configuración básica | Edición de perfil funcional |
| 1.9 | Seed de dev + verificación final: build, lint, test del flujo registro→dashboard | Criterio de salida de Fase 1 |

Las fases 2–9 siguen el orden de la sección 24 del requerimiento; cada una comenzará con revisión del código existente y un mini-plan propio.

---

## E. Decisiones que requieren confirmación

1. **Base de datos** — No hay PostgreSQL ni Docker en esta máquina. **Recomendación: Neon (Postgres serverless, free tier)** — solo requiere crear cuenta y pegar la `DATABASE_URL` en `.env`. Alternativas: Supabase (igual de válida), instalar PostgreSQL localmente en Windows, o SQLite solo-dev (desaconsejado: Prisma+SQLite no soporta enums ni Json nativo, divergiría del schema de producción).
2. **Librería de auth** — **Recomendación: Better Auth** (email+password y reset nativos, adaptador Prisma, API moderna). Alternativa: Auth.js/NextAuth v5 (más conocida, pero email+password vía Credentials es un ciudadano de segunda clase y el reset hay que construirlo a mano).
3. **Proveedor de IA** — **Recomendación: Anthropic API con `claude-sonnet-5`** detrás de la abstracción `AIProvider`. Requiere una `ANTHROPIC_API_KEY` (la pondrás tú en `.env`, nunca en frontend). La abstracción permite añadir OpenAI u otro después sin tocar la app.
4. **Email transaccional (reset de contraseña)** — **Recomendación: Resend (free tier)** para producción; en desarrollo el enlace de reset se registra en consola para no bloquear la Fase 1. Puede posponerse: el MVP funciona sin proveedor de email real.
5. **Idioma de la UI** — **Recomendación: español únicamente en el MVP**, con textos centralizados en constantes para facilitar i18n futura.
6. **Publicación por snapshot** — **Recomendación: publicar = crear `FunnelVersion` inmutable** que consume el runner (descrito en la sección A). Editar tras publicar no afecta al funnel en vivo hasta re-publicar. Si prefieres "editar en vivo", se simplifica, pero se pierde consistencia de datos por versión.

### Riesgos e inconsistencias detectadas

- **Slug global único**: `/f/{slug}` no incluye workspace, así que el slug debe ser único en toda la plataforma → al generar/duplicar se auto-sufija (`-2`, `-3`) si colisiona.
- **Salida de IA no determinista**: mitigado con schema Zod estricto + validación de coherencia referencial + 1 reintento con feedback + error visible (nunca funnel a medias), como exige la sección 6.
- **Rate limiting por instancia**: la implementación MVP (memoria/DB) es suficiente para una instancia; si se despliega serverless multi-región habrá que migrar a Redis/Upstash — la interfaz quedará abstraída desde el inicio.
- **Datos personales**: leads y respuestas contienen PII → cascadas de borrado ya diseñadas, campo `consent` obligatorio configurable, y minimización (solo campos activados en Lead Capture).
- **`FunnelVersion` vs edición**: el requerimiento lista la entidad pero no define su semántica; la Decisión 6 la fija explícitamente para evitar ambigüedad.
- **Analytics en Postgres**: volumen MVP es trivial para una tabla indexada; si crece, se particiona o se mueve a un store analítico — el diseño por eventos lo permite.
