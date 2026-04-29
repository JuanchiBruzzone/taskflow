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

## Reset completo

```bash
docker compose down -v
```

Esto borra la base de datos y los `node_modules` guardados en volumenes de Docker.
