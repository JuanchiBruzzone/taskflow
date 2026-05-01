# TaskFlow Docker

Este entorno reemplaza el flujo local de `setup.sh` + `npm run dev`.

## Levantar la app

```bash
docker compose up
```

Servicios:

- Frontend: http://localhost:5173
- API: http://localhost:3001
- PostgreSQL: `localhost:5432`
- Base de desarrollo: `taskflow_dev`
- Base de tests: `taskflow_test`

El servicio `setup` corre antes que la app:

- `npm install`
- `prisma generate`
- `prisma migrate deploy`
- seed inicial si la base esta vacia

En un entorno limpio, PostgreSQL crea dos bases:

- `taskflow_dev`: la usa la app cuando corres `docker compose up`.
- `taskflow_test`: la usan los integration tests de la practica.

Si ya tenias un volumen viejo de Docker, los scripts de inicializacion de Postgres no se vuelven a ejecutar. En ese caso, crea la base de test una sola vez:

```bash
docker compose up -d postgres
docker compose exec postgres createdb -U postgres taskflow_test
```

Si el comando responde que la base ya existe, podes seguir.

## Variables de entorno

El Compose define estas variables para los servicios Node:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `development` |
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/taskflow_dev?schema=public` |
| `JWT_SECRET` | `taskflow-dev-secret-docker` |
| `PORT` | `3001` |
| `POSTGRES_HOST` | `postgres` |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `POSTGRES_DB` | `taskflow_dev` |
| `VITE_API_URL` | `http://localhost:3001` |
| `TASKFLOW_URL` | `http://api:3001` |
| `BASE_URL` | `http://web:5173` |

`apps/api/.env.test` usa `taskflow_test` para los integration tests.

## Usuarios de prueba

| Email | Password |
|-------|----------|
| `alice@taskflow.dev` | `Password1` |
| `bob@taskflow.dev` | `Password1` |
| `seed@test.com` | `Password1` |

## Comandos utiles

```bash
docker compose up postgres api
docker compose up postgres web

docker compose run --rm lint
docker compose run --rm typecheck
docker compose run --rm test-unit
docker compose run --rm test-integration
docker compose run --rm test-bdd
docker compose run --rm performance
```

## Probar Parte 1

La parte 1 corresponde a los integration tests de proyectos:

- `POST /projects` crea un proyecto autenticado.
- `POST /projects` rechaza nombre vacio.
- `POST /projects` rechaza requests sin token.
- `GET /projects` lista solo los proyectos del usuario autenticado.

### Opcion recomendada: desde Docker

Desde la raiz del repo:

```bash
docker compose up -d postgres
docker compose run --rm setup
docker compose run --rm test-integration
```

Ese ultimo comando corre todos los integration tests, incluida la parte 1:

```text
apps/api/tests/integration/projects.integration.test.ts
```

Para correr solo el archivo de la parte 1:

```bash
docker compose run --rm api npm run test:integration -- --run tests/integration/projects.integration.test.ts
```

### Si `taskflow_test` no existe

Si ves un error de conexion o de base inexistente, corre:

```bash
docker compose up -d postgres
docker compose exec postgres createdb -U postgres taskflow_test
docker compose run --rm api npm run db:migrate:test
docker compose run --rm test-integration
```

### Reset y prueba limpia

Para borrar datos, dependencias Docker y volver a probar desde cero:

```bash
docker compose down -v
docker compose up -d postgres
docker compose run --rm setup
docker compose run --rm test-integration
```

`docker compose down -v` borra los volumenes. Despues de eso, Postgres vuelve a ejecutar `docker/postgres/init/01-create-test-db.sql` y recrea `taskflow_test`.

## Reset completo

```bash
docker compose down -v
```

Esto borra la base de datos y los `node_modules` guardados en volumenes de Docker.
