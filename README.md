# ShipLog

Bitácora de desarrollo: registra qué construiste en cada proyecto y míralo agrupado por semana. Ver `plan.md`.

## Características

- **Multiusuario**: Cada usuario ve solo sus proyectos, gracias a Row Level Security (RLS) de Supabase
- **Autenticación simple**: Magic link vía email, sin contraseñas
- **Entradas flexibles**: Registra features, bugfixes, refactor y otros cambios con tags personalizados
- **Timeline semanal**: Las entradas se agrupan automáticamente por semana (formato ISO)
- **Proyectos públicos**: Puedes hacer público un proyecto y compartir un resumen semanal
- **Integración con GitHub**: Sugerencias revisables a partir de commits y PRs mergeados de repositorios públicos

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos**: Tailwind CSS 4 + shadcn/ui + Base UI
- **Backend/Database**: Supabase (Postgres + Auth + RLS)
- **Desarrollo local**: Docker (para Supabase local) + Mailpit (para emails de prueba)
- **Despliegue**: Vercel

## Estructura del Proyecto

```
├── src/
│   ├── app/              # Rutas Next.js (App Router)
│   ├── components/       # Componentes reutilizables
│   ├── lib/              # Utilidades y configuración de Supabase
│   └── styles/           # Estilos globales
├── supabase/
│   ├── migrations/      # Migraciones SQL
│   ├── seed.sql         # Datos de ejemplo
│   └── config.toml      # Configuración de Supabase local
└── public/               # Archivos estáticos
```

## Modelo de Datos

### Projects
- `id`, `user_id`, `name`, `slug`, `description`, `repo_url`
- `status`: active | paused | done
- `is_public`: boolean para habilitar vistas públicas

### Entries
- `id`, `project_id`, `user_id`, `title`, `body` (markdown)
- `kind`: feature | bugfix | refactor | other
- `tags`: array de strings
- `shipped_at`: fecha de la entrada

## Desarrollo local

Requiere Node 22 y Docker (para Supabase local).

```bash
npm install
npm run supabase:start     # imprime API URL y publishable key
cp .env.example .env.local # pega la publishable key
npm run dev                # http://localhost:3000
```

### Autenticación Local

Login por magic link: escribe un correo en `/login` y abre el enlace en Mailpit (http://127.0.0.1:54324). El seed crea `demo@shiplog.local` con un proyecto de ejemplo.

### Comandos Útiles

- `npm run supabase:reset` - Recrea la base de datos y ejecuta el seed
- `npm run db:types` - Regenera `src/lib/database.types.ts` después de cambios en el schema
- `npm run lint` - Ejecuta ESLint
- `npm run typecheck` - Verifica tipos TypeScript
- `npm run build` - Construye para producción
- `npm run supabase:stop` - Detiene Supabase local

## Rutas de la Aplicación

| Ruta | Contenido |
|---|---|
| `/login` | Formulario de magic link |
| `/` | Lista de proyectos del usuario + botón crear |
| `/projects/new` | Formulario: nombre, descripción, repo_url, estado |
| `/projects/[slug]` | Detalle: cabecera del proyecto + timeline agrupada por semana + formulario rápido de entrada |
| `/projects/[slug]/edit` | Editar / archivar / hacer público |
| `/p/[slug]` | Vista pública del proyecto (solo si `is_public`) |
| `/p/[slug]/week/[yyyy-ww]` | Resumen semanal público compartible |

## Roadmap

### Fase 1 — Núcleo (MVP actual)
- ✅ Scaffold Next.js + Supabase, migración SQL y RLS
- ✅ Auth con magic link, middleware de sesión
- ✅ CRUD de proyectos
- ✅ CRUD de entradas con formulario rápido en el detalle
- ✅ Timeline agrupada por semana (ISO)

### Fase 2 — Resumen compartible
- ⏳ Páginas públicas `/p/[slug]` y `/p/[slug]/week/[yyyy-ww]`
- ⏳ Toggle `is_public` y copiar enlace
- ⏳ Metadatos OG para compartir en redes

### Fase 3 — Automatización
- ✅ Conectar un repo público de GitHub y sugerir entradas a partir de commits/PRs mergeados
- ⏳ Recordatorio semanal por email (Resend) si no hubo entradas

Para usar las sugerencias, añade la URL de un repositorio público de GitHub en la edición del proyecto y pulsa **buscar cambios** en su timeline. Puedes revisar y editar cada sugerencia antes de guardar. No se requiere token para repositorios públicos; los repos privados no están soportados.

## Variables de Entorno

Copia `.env.example` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Para conectar a Supabase en producción, usa `npm run dev:prod` con `.env.prod`.

## Contribución

Este proyecto está en desarrollo activo. Si quieres contribuir:

1. Revisa el `plan.md` para entender la visión general
2. Asegúrate de pasar `npm run lint` y `npm run typecheck`
3. Si modificas el schema de la base de datos, ejecuta `npm run db:types` después de las migraciones

## Licencia

MIT
