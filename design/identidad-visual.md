# Handoff: AIFUNNEL — App SaaS de funnels con IA (desktop + mobile)

## Overview
AIFUNNEL es una app SaaS para crear funnels interactivos (diagnósticos, quizzes, captura de leads) con ayuda de IA, orientada a clínicas y negocios de estética/salud. Este paquete cubre:

1. **App de escritorio** (1440×940): Dashboard, Mis Funnels, wizard "Crear con IA", pantalla de generación, Funnel Builder y el funnel público que ve el paciente.
2. **Versión mobile** (390×844): 10 pantallas equivalentes.
3. **Identidad visual**: paleta azul petróleo sobre sistema marfil, tipografía Inter Tight / Inter.

## About the Design Files
Los archivos de este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran el aspecto y comportamiento previstos, no código de producción. La tarea es **recrear estos diseños en el entorno del codebase destino** (React, Next.js, Vue, etc.) usando sus patrones y librerías establecidos. Si aún no existe un codebase, elige el framework más apropiado (recomendado: Next.js + React) e implementa allí.

Los archivos `.dc.html` contienen la plantilla dentro de `<x-dc>…</x-dc>` (markup con estilos inline) y la lógica en un `<script data-dc-script>` (clase JS estilo React con `state`/`setState`). Ignora el runtime (`support.js`, `_ds_bundle.js`); lee el markup y la clase como especificación.

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, espaciados y estados son finales. Recrear pixel-perfect con las librerías del codebase.

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| Accent (petróleo) | `#1D3F52` | botones primarios, selecciones, barras de progreso, links, "ai" del wordmark en fondos claros |
| Accent hover | `#14303F` | hover de botón primario |
| Petróleo profundo | `#122C3D` / `#132E3F` / `#142F40` | extremos de gradientes oscuros |
| Accent tint | `#E7EEF2` | badges "Published", fondos de KPI delta, avatar sobre oscuro |
| Accent claro (sobre oscuro) | `#7FA8C4` | "ai" del wordmark sobre fondo oscuro, checks de generación |
| Línea de datos 1 | `#9FC5DC` | serie "Visitas" del gráfico |
| Línea de datos 2 | `#7A9BB0` | serie "Leads" |
| Texto sobre oscuro secundario | `#9BB4C4` | nav inactiva del sidebar, subtítulos sobre petróleo |
| Texto sobre oscuro leyendas | `#B9CCD8` | leyendas del gráfico |
| Fondo página | `#FCFBF9` | superficie principal (warm white) |
| Superficie secundaria | `#F1F0ED` | fondos ivory, fills de selección, canvas del builder |
| Cards | `#FFFFFF` | tarjetas sobre `#FCFBF9` |
| Texto fuerte | `#403C38` | titulares y cuerpo |
| Texto primario | `#696660` | descripciones |
| Texto secundario | `#85817B` | metadatos |
| Texto placeholder | `#A9A6A1` | placeholders, "Powered by aifunnel" |
| Borde fuerte | `#84827E` | botones secundarios |
| Borde soft | `#D3D1CC` | bordes punteados, dots inactivos |
| Borde ultralight | `#E5E3DF` | bordes de cards, divisores |
| Divisor sutil | `#F1F0ED` | filas de tabla, hairlines internas |
| Draft badge | `#F2ECE4` / `#A18463` | fondo/texto |
| Archived badge | `#ECE9E6` / `#817870` | fondo/texto |
| Destructivo (texto) | `#925E54` | "Eliminar" — solo texto, nunca botón rojo |
| Overlay modal | `rgba(51,46,42,.34)` | scrim |

Gradientes (solo superficies petróleo, nunca decorativos):
- Sidebar / drawer: `linear-gradient(180deg,#1D3F52,#122C3D)`
- Card Rendimiento: `linear-gradient(160deg,#1D3F52,#132E3F)`
- Thumbnails de funnel: `linear-gradient(160deg,#1D3F52,#142F40)`
- Sobre oscuro: hover `rgba(231,238,242,.09)`, pills `rgba(231,238,242,.12)`, hairlines `rgba(231,238,242,.16)`, barras skeleton `rgba(252,251,249,.30)` y `.16`

### Tipografía
- **Display**: Inter Tight 600/700, letter-spacing −0.02em a −0.05em (wordmark −0.05em/−0.075em), line-height ≈1.0–1.15.
- **Interfaz**: Inter 400/500/600, line-height 1.45.
- **Mono**: `ui-monospace` solo para valores hex.
- Casing: minúsculas en headings de marca y micro-labels UPPERCASE (`letter-spacing:.045em`). Sin emoji, sin Title Case.
- Escalas desktop: h1 34px, título de sección 20px, card KPI valor 34px, cuerpo 14.5–15.5px, meta 12.5–13.5px, micro-label 11.5–12px.
- Escalas mobile: h1 24–26px, pregunta pública 27px, hero público 32px, cuerpo 14–15px, meta 12–12.5px. Nada bajo 13px en contenido (metas 12–12.5px son el mínimo tolerado).

### Espaciado, radios, sombras, motion
- Escala base 8 (4·8·12·16·24·32·40·48).
- Radios: 9–10px controles pequeños, **12px botones/inputs**, 14px cards y option rows, 16px paneles/thumbnails, 20px modal, 28px marco de teléfono, 999 pills.
- Sombra: solo el modal `0 6px 24px rgba(51,46,42,.14)`; todo lo demás sin sombra — la estructura es de bordes 1px.
- Motion: `cubic-bezier(0.22,1,0.36,1)`; hover 140–180ms, selección 160ms, barras de progreso 320ms. Sin bounce ni parallax.
- Selección: borde pasa de 1px `#E5E3DF` a **2px `#1D3F52`** + fill `#F1F0ED` + dot de 7–9px en accent. Nunca escala ni opacidad.
- Hover primario: `#1D3F52 → #14303F`. Secundario: fill `#EAE8E4`. Rows: fill `#F7F6F3`.

### Wordmark
`aifunnel` en Inter Tight 700, lowercase, letter-spacing −0.05em (−0.075em en tamaños display), con el prefijo `ai` coloreado: `#1D3F52` sobre claro, `#7FA8C4` sobre oscuro. Sin logo gráfico; la marca es tipográfica.

---

## Screens / Views — Desktop (`AIFUNNEL App.dc.html`, 1440×940)

Shell: sidebar fijo 248px + columna principal (header 68px + contenido).

### 1. Sidebar (global)
- 248px, gradiente petróleo vertical, borde derecho `#14303F`, padding 20px 14px.
- Wordmark 23px arriba. Nav de 9 ítems: Dashboard, Mis Funnels, Crear con IA, Templates, Leads, Analytics, Integraciones, Mi Marca, Configuración.
- Ítem: fila 38px, radius 10px, dot 5px `#7FA8C4` solo en activo; activo texto `#FCFBF9` 600, inactivo `#9BB4C4` 400; hover `rgba(231,238,242,.09)`.
- Footer: link "ayuda y soporte", hairline `rgba(231,238,242,.16)`, avatar 34px `#E7EEF2` con iniciales petróleo + nombre/clínica.

### 2. Header (global)
- 68px, fondo `#FCFBF9`, borde inferior `#E5E3DF`, padding 0 32px.
- Izquierda: breadcrumb 12px `#85817B` + título 20px Inter Tight 600.
- Derecha: campana 38px con dot notificación petróleo, botón primario "+ Crear funnel" (38px alto, radius 10px), avatar 38px `#E7EEF2`.

### 3. Dashboard
- Padding 32px, gap 22px.
- Saludo h1 34px "Hola, bienvenida de nuevo" + subtítulo; botón "+ Crear funnel" 46px a la derecha.
- **KPIs**: grid 4 columnas gap 16px. Card blanca, borde `#E5E3DF`, radius 14px, padding 20px: label 13.5px, valor 34px Inter Tight, delta pill (`#E7EEF2`/`#1D3F52`), "vs. 30 días anteriores" 12.5px. Valores: 12 (+12%), 8.240 (+8%), 1.420 (+24%), 17,2% (+3,1%).
- **Rendimiento**: card oscura (gradiente petróleo), radius 16px, padding 24px. Título blanco + leyenda (Visitas `#9FC5DC`, Leads `#7A9BB0`, Conversiones `rgba(252,251,249,.4)`); toggle 7/30/90 días en pill `rgba(231,238,242,.12)` con opción activa en chip blanco. Gráfico SVG de líneas 230px: grid `rgba(252,251,249,.08)`, área bajo Visitas `rgba(231,238,242,.10)`.
- **Funnels recientes**: tabla en card blanca radius 16px. Header de columnas 12px UPPERCASE sobre `#F7F6F3` (Funnel/Estado/Visitas/Leads/Conversión/Modificado). Filas: thumbnail 34px, nombre + tipo, badge de estado pill, métricas; hover `#F7F6F3`; clic navega al Builder. Link "Ver todos".

### 4. Mis Funnels
- Título + contador "14 funnels · 4 publicados", botón "+ Nuevo funnel".
- Tabs subrayadas (Todos/Activos/Borradores/Archivados): activa borde inferior 2px petróleo + 600. Derecha: buscador 280px, dropdowns Estado y Recientes.
- Grid 3 columnas gap 18px. Card: thumbnail 150px con gradiente petróleo (mini wordmark blanco, badge de estado, barras skeleton claras y mini-botón `#E7EEF2`), cuerpo con nombre/tipo/fecha y fila de métricas separada por hairline. Hover: borde de card pasa a `#1D3F52`.

### 5. Modal "¿Cómo quieres empezar?"
- Scrim `rgba(51,46,42,.34)`, card 720px `#FCFBF9`, radius 20px.
- Dos tarjetas: **Crear con IA** (icono óvalo petróleo en tile `#E7EEF2`, CTA primario "Empezar con IA") y **Usar template** (tile `#F1F0ED`, CTA secundario "Explorar templates"). Hover: borde petróleo. Cierra con ✕.

### 6. Wizard "Crear con IA" (6 pasos)
- Columna centrada 720px. Micro-label "crear con ia", h1 36px, subtítulo.
- Barra de progreso 3px con labels "Paso N de 6" / nombre del paso; ancho = N/6, transición 320ms.
- Card 32px padding, min-height 330px, pregunta 26px Inter Tight.
- Pasos: 1 Negocio (grid 3×3 de opciones), 2 Objetivo (grid 3×3), 3 Oferta (textarea 1 línea + ayuda), 4 Audiencia (textarea alta), 5 Acción final (grid de 7), 6 Contexto (textarea alta).
- Opción seleccionada: 2px petróleo + `#F1F0ED` + 500. Footer: "Atrás" secundario / "Continuar" primario ("Generar funnel" en paso 6).

### 7. Generando
- Centrado: tile 96px petróleo radius 26px con óvalo blanco (`border-radius:50% 50% 50% 50% / 42% 42% 58% 58%`), h1 32px, checklist de 5 pasos (Analizando objetivo → Preparando CTA) que se completan cada ~700ms: dot 20px pasa de `#E5E3DF` a petróleo con ✓. Al terminar → pantalla "Tu funnel está listo" (tile ✓ petróleo, CTAs "Ver funnel" / "Volver a mis funnels").

### 8. Funnel Builder
- Barra propia 60px: ← volver, nombre, badge Draft, y botones Preview / Guardar / Publicar (primario).
- Split 40% editor / 60% preview.
- **Editor**: tabs subrayadas Diseño · Preguntas · Lógica · Resultados · Lead Capture · CTA.
  - Diseño: upload de logo (borde punteado), pickers de color principal/secundario (swatch + hex mono), select de tipografía, swatches de fondo (4), estilo de botones (3 segmentos).
  - Preguntas: cards arrastrables (handle ⠿) con nº, texto, tipo y acciones Editar/Duplicar/Eliminar (clay); "+ Agregar pregunta" punteado.
  - Lógica: reglas SI/ENTONCES con chips (`SI` en `#E7EEF2`/petróleo, `ENTONCES` en `#F1F0ED`).
  - Resultados: cards con nombre, rango de puntos en pill, descripción.
  - Lead Capture: toggle "Activar captura", checklist de campos (Nombre/Teléfono/Email ✓, Ciudad off), posición (antes/después del resultado), texto de consentimiento.
  - CTA: grid de 6 tipos (WhatsApp seleccionado), campo de número, mensaje con variables `{{funnel_name}}` / `{{result}}`.
- **Preview**: fondo `#F1F0ED`, toggle Desktop/Mobile centrado (mobile = marco 390px radius 28px). Muestra la pantalla de pregunta del funnel con header "Clínica Nova", contador "Pregunta 2 de 6", barra 2px, opciones y CTA "Continuar".

### 9. Funnel público (overlay pantalla completa)
- Header 56px "Clínica Nova" + "Salir del preview ✕".
- **Intro**: split 50/50 — izquierda micro-label "análisis facial inteligente", h1 56px "¿Qué tratamiento facial es para ti?", copy, CTA "Comenzar" 56px, meta "6 preguntas · menos de 3 minutos"; derecha placeholder de foto (patrón de rayas diagonales `repeating-linear-gradient(112deg,#E5E3DF 0 12px,#EDEBE7 12px 24px)` + etiqueta `[PHOTO-HERO] · 4:5`).
- **Pregunta**: columna 640px, contador + barra 2px, pregunta 36px, opciones grandes (padding 20px, radius 14px, dot 9px), CTA. Footer "Powered by aifunnel".
- **Resultado**: placeholder `[PHOTO-RESULT] 16:9`, micro-label "tu resultado", h2 40px "Perfil firmeza", descripción hedged ("Se observan indicadores…"), card "recomendación", CTAs "Agendar evaluación" / "Compartir resultado", disclaimer "Este resultado es orientativo y no constituye un diagnóstico médico."

## Screens / Views — Mobile (`AIFUNNEL Mobile.dc.html`, 390×844)

Marcos radius 28px. CTA principal siempre fijo abajo (52–54px, radius 12px, petróleo). Top bar 54–58px con hairline `#F1F0ED`.

1. **Dashboard**: top bar hamburguesa + wordmark + avatar; saludo 24px; KPIs en grid 2×2 (valor 24px, delta pill); card Rendimiento oscura con SVG 90px y leyenda; lista "Funnels recientes" como cards apiladas (nombre + badge + línea de métricas con middle dots); CTA fijo "+ Crear funnel".
2. **Menú drawer**: panel 300px con gradiente petróleo sobre scrim `rgba(19,32,42,.4)`; mismos 9 ítems del sidebar, filas 42px; footer avatar.
3. **Mis Funnels**: buscador 44px; chips scrolleables (Todos activo en petróleo sólido, resto outline); cards con thumbnail 96px (gradiente petróleo o `#F1F0ED` para drafts) + metadatos con middle dots; CTA fijo "+ Nuevo funnel".
4. **Wizard IA (paso 2)**: top bar ← / título / ✕; progreso "Paso 2 de 6 · Objetivo" + barra 3px al 33%; pregunta 25px; opciones apiladas (seleccionada 2px petróleo); footer doble botón Atrás (flex 1) / Continuar (flex 2).
5. **Generando**: pantalla completa en gradiente petróleo; tile óvalo blanco; checklist 5 pasos, hechos con dot `#7FA8C4` ✓, pendientes outline `rgba(231,238,242,.3)`.
6. **Builder editor**: top bar con nombre truncado + badge Draft + "Publicar" compacto (32px); tabs Editor|Preview subrayadas; chips de sección (Preguntas activa); cards de preguntas con handle ⠿ y menú ⋯; "+ Agregar pregunta".
7. **Builder preview**: tab Preview activa; canvas `#F1F0ED` con mini-teléfono 300×600 mostrando la pantalla de pregunta.
8. **Público intro**: header "Clínica Nova"; hero foto 320px (placeholder rayado `[PHOTO-HERO] 4:5`); micro-label + h1 32px + copy + meta; CTA "Comenzar" + "Powered by aifunnel".
9. **Público pregunta**: contador "Pregunta 3 de 6" + barra al 50%; pregunta 27px; 4 opciones (Mixta seleccionada); CTA fijo.
10. **Público resultado**: placeholder `[PHOTO-RESULT] 16:9` 180px; "tu resultado" + "Perfil firmeza" 30px + descripción; card recomendación; disclaimer; CTAs "Agendar evaluación" / "Compartir resultado".

## Interactions & Behavior
- Navegación: sidebar/drawer cambia de pantalla; fila de tabla y card de funnel abren el Builder; "Preview" en el Builder abre el funnel público; ✕ vuelve al Builder.
- Modal crear: "+ Crear funnel" → modal; "Empezar con IA" → wizard paso 1; ✕ o "Explorar templates" cierra.
- Wizard: Atrás en paso 1 vuelve a Mis Funnels; "Generar funnel" (paso 6) lanza la secuencia de generación (5 pasos, ~700ms c/u, configurable) y termina en "Tu funnel está listo".
- Público: Comenzar → preguntas; elegir opción la marca; Continuar avanza y resetea selección; tras la 3ª pregunta muestra el resultado (en producción: 6 preguntas + lógica de scoring por reglas).
- Toggle Desktop/Mobile del preview cambia el ancho del marco (100% ↔ 390px) y el radius (16 ↔ 28).
- Estados de funnel: Published / Draft / Archived con sus badges.

## State Management
Estado mínimo del prototipo (clase en `AIFUNNEL App.dc.html`):
`screen` (dashboard|funnels|wizard|generating|ready|builder|public) · `range` (7/30/90 días) · `modal` (bool) · `step` (1–6) · `wiz` (respuestas: biz, goal, promo, ideal, cta, extra) · `gen` (0–5, progreso de generación) · `tab` (tab del builder) · `tab2` (filtro de Mis Funnels) · `device` (Desktop|Mobile) · `pub` (intro|question|result) · `pubQ` (índice de pregunta) · `pubPick` (opción elegida).

Datos a fetchear en producción: KPIs, series del gráfico, lista de funnels con métricas, definición del funnel (preguntas, reglas, resultados, campos de lead, CTA), branding de la clínica.

## Assets
- **Fuentes**: Google Fonts — Inter Tight (400–700) e Inter (400–600).
- **Fotografía**: no incluida. Los bloques rayados con etiquetas `[PHOTO-HERO]`, `[PHOTO-RESULT]` son placeholders con dirección de arte anotada (ratio y luz). Sustituir por fotografía real: cálida, luz suave, piel real con textura, sin filtros ni before/after.
- **Iconos**: casi ninguno — unicode (←, ✕, ⋯, ⠿, ✓, ▾) y 2 SVG inline (campana, lupa, hamburguesa) de trazo 1.5–1.8px. Si se necesita un set, usar Lucide monocromo.
- **Logo**: tipográfico (ver Design Tokens → Wordmark); no hay archivo de logo.

## Copy
Todo el copy es final y está en los archivos: español neutro-chileno, tono orientativo y no diagnóstico ("se observan indicadores…", "resultado orientativo"), niveles en palabras (presencia leve/visible) en lugar de scores, sin emoji ni exclamaciones. Mantener verbatim.

## Files
- `AIFUNNEL App.dc.html` — prototipo interactivo desktop (todas las pantallas + estados).
- `AIFUNNEL Mobile.dc.html` — las 10 pantallas mobile estáticas.
- `AIFUNNEL Identidad.dc.html` — exploración de identidad (4 acentos; el elegido es 1b azul petróleo `#1D3F52`).
