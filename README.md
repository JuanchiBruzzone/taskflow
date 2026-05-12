# TaskFlow 🗂️

Equipo:

- Juan Ignacio Bruzzone
- Giuliana Bordon Castro
- Felipe Sere
- Agustin Bidart

Workflow habilitado.

Hito 1: Pronto

Proyecto integrador del curso **Testing y Calidad de Software**.
App de gestión de tareas (tipo Jira simplificado) con suite completa de tests.

---

## Setup rápido

> **TL;DR — tres comandos y ya:**

```bash
# 1. Asegurate de tener PostgreSQL corriendo (ver abajo si no lo tenés)
# 2. Cloná el repo y entrá a la carpeta
bash setup.sh       # instala, migra y carga datos de prueba
npm run dev         # levanta API + frontend
```

Abrí **http://localhost:5173** e iniciá sesión con:

| Email | Contraseña |
|-------|-----------|
| `alice@taskflow.dev` | `Password1` |
| `bob@taskflow.dev` | `Password1` |

El script `setup.sh` es idempotente: podés correrlo todas las veces que quieras sin romper nada.

---

## Prerrequisitos

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL corriendo en localhost:5432**

### ¿No tenés PostgreSQL? Dos opciones:

**Opción A — Homebrew (macOS)**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Opción B — Docker**
```bash
docker run --name taskflow-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16
```

Si usás Docker, antes de correr `setup.sh` editá `apps/api/.env` con:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

---

## Correr los tests

```bash
npm run test:unit         # Vitest — lógica pura, con coverage
npm run test:integration  # Vitest + Supertest — rutas HTTP
npm run test:bdd          # Cucumber — escenarios Gherkin
npm run test:e2e          # Playwright — flujos completos (requiere app corriendo)
npm run test:all          # todos en orden

# Performance (requiere k6 instalado: brew install k6)
k6 run performance/scenarios/api-load.k6.js
```
---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React 18 + TypeScript + Vite |
| ORM | Prisma + PostgreSQL |
| Unit/Integration | Vitest + Supertest |
| BDD | Cucumber.js + Gherkin |
| E2E | Playwright |
| Performance | k6 |
| CI/CD | GitHub Actions |

---

## Estructura

```
taskflow/
├── apps/
│   ├── api/               # Backend Express + TypeScript (puerto 3001)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/  ← lógica de negocio + bugs intencionales
│   │   │   ├── middleware/
│   │   │   └── prisma/    ← schema, migraciones y seed
│   │   └── tests/
│   │       ├── unit/        ← Vitest — lógica pura
│   │       └── integration/ ← Vitest + Supertest
│   └── web/               # Frontend React 18 + Vite (puerto 5173)
│       └── src/
│           ├── api/         ← cliente Axios con interceptor JWT
│           ├── contexts/    ← AuthContext
│           ├── pages/       ← Login, Register, Projects, ProjectDetail, TaskDetail
│           ├── components/  ← Navbar, TaskCard*, CommentList*
│           └── types/       ← tipos del dominio
├── e2e/               # Playwright + Cucumber
│   ├── features/      ← archivos .feature (Gherkin)
│   ├── pages/         ← Page Object Model
│   └── step-definitions/
├── performance/       ← k6 scripts
├── docs/adr/          ← Architecture Decision Records
├── setup.sh           ← script de setup inicial
└── .github/workflows/ ← CI/CD pipelines
```

`*` Componentes con TODOs intencionales para ejercicio de estudiantes.

---

## Frontend (`apps/web`)

| Ruta | Pantalla |
|------|---------|
| `/register` | Registro de usuario |
| `/login` | Login |
| `/projects` | Lista de proyectos |
| `/projects/:id` | Detalle de proyecto + tareas |
| `/projects/:id/tasks/:taskId` | Detalle de tarea + comentarios |

```bash
npm run dev:web    # solo frontend → http://localhost:5173
npm run build:web  # build de producción
```

### TODOs para estudiantes

Dos componentes tienen funcionalidad **intencionalmente incompleta**:

- **`TaskCard.tsx`** — badge de color según prioridad (`LOW/MEDIUM/HIGH/CRITICAL`)
- **`CommentList.tsx`** — formateo de fecha de cada comentario

Buscá los comentarios `// TODO (estudiante):` en esos archivos.

---

## Hitos del semestre

| Clase | Entregable |
|-------|-----------|
| 3 | Repo + pipeline lint verde |
| 5 | US-01 y US-02 con unit + integration tests |
| 7 | US-03–05 + escenarios BDD pasando |
| 9 | US-06–08 + coverage ≥ 80% |
| 11 | E2E flujos críticos + contract tests |
| 13 | Scripts k6 + reporte SLOs |
| 15 | Suite completa + ADR + trazabilidad |
| 16 | Demo day 🎉 |

---

## Hito 4 — Performance (k6) — Pasos rápidos

Pequeña guía para ejecutar el smoke test/local k6 tal como se pide en el hito 4.

- Asegurate de levantar PostgreSQL y la API. Opciones:

  - Docker Compose (recomendado):

    ```bash
    docker compose up -d postgres
    docker compose run --rm setup    # instala deps, genera prisma, aplica migraciones y seed
    ```

  - Local (Homebrew / sistema): arrancá Postgres y luego ejecutá:

    ```bash
    bash setup.sh
    ```
- Asegurate de que la API pueda conectar a la base de datos (Postgres). Si usás Docker
  Compose el servicio `setup` se encarga de generar migraciones y cargar el seed.

- Levantá la API desde la raíz del repo (esto usa la config del workspace):

  ```bash
  npm run dev
  # La API debe responder en http://localhost:3001
  curl -i http://localhost:3001/health
  ```

- Ejecutar el smoke test (desde la raíz del repo — importante):

  ```bash
  k6 run --env BASE_URL=http://localhost:3001 --vus 1 --duration 15s performance/scenarios/api-load.k6.js
  ```

  - Nota: ejecutar `k6` desde `apps/api` hace que el path relativo al script no se encuentre.

- Qué comprobar en la salida de `k6`:
  - `register status 201`
  - `login status 200`
  - `project create status 201`
  - `task create status 201`
  - `projects status 200`
  - `tasks status 200`

- Usuarios de seed: `alice@taskflow.dev` / `Password1`, `bob@taskflow.dev` / `Password1`.

---
## Definition of Done

Una US está DONE cuando:
- [ ] Código compila sin errores TS
- [ ] Unit tests pasan con coverage ≥ 80%
- [ ] Integration tests cubren happy path + 2 casos de error
- [ ] Escenarios Gherkin implementados y pasando
- [ ] Sin errores ESLint
- [ ] Pipeline CI verde
- [ ] Matriz de trazabilidad actualizada
- [ ] PR con al menos 1 review aprobado
