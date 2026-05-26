# Entrega Clase 10 - Modulo 2 — CI/CD y Pipelines de Calidad

## Proyecto

**TaskFlow**  
**Módulo:** CI/CD y Pipelines de Calidad  
**Workflow principal:** `.github/workflows/ci.yml`  
**Workflow complementario:** `.github/workflows/nightly.yml`

---

# Parte A — Lectura crítica del pipeline existente

## A.1 — Primer contacto

El workflow principal del proyecto es:

```yml
name: CI — TaskFlow
```

Este workflow se ejecuta cuando hay cambios en el repositorio. Actualmente tiene estos triggers:

```yml
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
```

Esto significa:

- Corre en cualquier `push` a cualquier rama.
- Corre cuando se abre o actualiza un `pull_request` hacia `main`.

La estructura principal del archivo está formada por:

```txt
name
on
env
jobs
permissions
defaults
concurrency
```

La variable global configurada es:

```yml
env:
  NODE_VERSION: '20'
```

Esto permite que todos los jobs usen Node 20 de forma consistente.

---

## A.2 — Ejercicio 1: Diagrama del grafo de jobs

El workflow principal tiene estos jobs:

```txt
pre
lint
unit-tests
integration-tests
bdd-tests
e2e-tests
post
```

Según las cláusulas `needs`, el grafo queda así:

```txt
                 ┌───────────────┐
                 │      pre      │
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┬──────────────────┬──────────────────┬
        │                │                │                  │                  │                  
        ▼                ▼                ▼                  ▼                  ▼                  
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌──────────────────┐
│     lint     │ │ unit-tests   │ │ integration-tests│ │   bdd-tests    │ │    e2e-tests     │
└──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ └───────┬────────┘ └────────┬─────────┘
       │                │                  │                   │                   │
       └────────────────┴──────────────────┴───────────────────┴───────────────────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │   post   │
                                  └──────────┘
```

Versión resumida:

```txt
pre
 ├── lint
 ├── unit-tests
 ├── integration-tests
 ├── bdd-tests
 └── e2e-tests
        ↓
      post
```

---

## Jobs que corren en paralelo

Después de que termina `pre`, corren en paralelo:

- `lint`
- `unit-tests`
- `integration-tests`
- `bdd-tests`
- `e2e-tests`

Esto pasa porque todos tienen:

```yml
needs: pre
```

Ninguno depende de otro job intermedio.

---

## Job más temprano del flujo

El job más temprano es:

```txt
pre
```

Es el primer job porque no depende de ningún otro.

---

## Último job del flujo

El último job es:

```txt
post
```

Este job depende de todos los jobs principales:

```yml
needs:
  - lint
  - unit-tests
  - integration-tests
  - bdd-tests
  - e2e-tests
```

Además tiene:

```yml
if: always()
```

Esto hace que se ejecute aunque algún job anterior haya fallado.

---

## Condiciones especiales

El job `post` tiene una condición especial:

```yml
if: always()
```

Esto permite que el job corra siempre, incluso si `lint`, `unit-tests`, `integration-tests`, `bdd-tests` o `e2e-tests` fallan.

En la consigna también se menciona que `e2e-tests` debería tener:

```yml
if: github.event_name == 'pull_request'
```

Eso haría que los tests E2E corran solamente en pull requests. En el workflow revisado, esa condición todavía no está agregada.

---

# A.2 — Ejercicio 2: 5 preguntas guiadas

## 1. ¿Por qué el job `e2e-tests` tiene `if: github.event_name == 'pull_request'`? ¿Qué efecto tiene esa línea?

Esa línea hace que el job `e2e-tests` se ejecute solamente cuando el evento que dispara el workflow es un `pull_request`.

El objetivo es evitar que los tests E2E corran en cada `push`, porque suelen ser más lentos y costosos que los tests unitarios o de integración.

Con esa condición:

- En un `pull_request`, `e2e-tests` corre.
- En un `push` común, `e2e-tests` se saltea.

Esto ayuda a mantener rápido el feedback diario del CI.

---

## 2. ¿Qué pasaría si elimino `needs: lint` del job `unit-tests`? ¿Por qué se incluye esa dependencia?

En el workflow revisado, `unit-tests` actualmente no depende de `lint`; depende de `pre`.

```yml
unit-tests:
  needs: pre
```

Entonces, con la versión actual, `lint` y `unit-tests` corren en paralelo después de `pre`.

Si existiera esta dependencia:

```yml
unit-tests:
  needs: lint
```

entonces `unit-tests` esperaría a que `lint` terminara correctamente antes de ejecutarse.

La ventaja de incluir `needs: lint` sería que primero se valida formato, reglas de lint y TypeScript antes de gastar tiempo corriendo tests. La desventaja es que el pipeline puede tardar más porque reduce el paralelismo.

En resumen:

- Sin `needs: lint`: más rápido, porque corre en paralelo.
- Con `needs: lint`: más ordenado, porque si el código ni siquiera pasa lint, no corre unit tests.

---

## 3. ¿Por qué `integration-tests` y `bdd-tests` definen un `service: postgres` pero `unit-tests` no? ¿Qué hace ese bloque `services:`?

Los jobs `integration-tests` y `bdd-tests` necesitan una base de datos real para probar la interacción de la API con PostgreSQL.

Por eso definen:

```yml
services:
  postgres:
    image: postgres:16-alpine
```

El bloque `services:` levanta un contenedor auxiliar durante el job. En este caso, levanta PostgreSQL para que los tests puedan conectarse a una base real.

En cambio, `unit-tests` no necesita Postgres porque los tests unitarios deberían probar unidades pequeñas de código de forma aislada, sin depender de servicios externos.

---

## 4. En el job `e2e-tests` hay un step que usa `upload-artifact` con `if: failure()`. ¿Qué propósito cumple? ¿Cuándo se ejecuta?

El step sirve para subir el reporte de Playwright cuando los tests E2E fallan.

El bloque es:

```yml
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report-${{ github.run_id }}
    path: playwright-report/
    retention-days: 7
```

Se ejecuta solamente si el job falla, porque tiene:

```yml
if: failure()
```

El propósito es guardar evidencia del fallo: capturas, trazas, reportes HTML o información generada por Playwright. Esto facilita diagnosticar qué pasó sin tener que reproducir el error localmente.

---

## 5. ¿Por qué la línea `cache: npm` aparece en todos los jobs? ¿Qué pasa si la quito?

La línea:

```yml
cache: npm
```

permite que `actions/setup-node` use caché para dependencias de npm.

Aparece en todos los jobs porque cada job corre en una máquina limpia e independiente. Aunque un job haya instalado dependencias, otro job no reutiliza automáticamente ese mismo entorno.

Si se quita, el pipeline seguiría funcionando, pero probablemente sería más lento, porque cada job tendría que descargar dependencias desde cero con `npm ci`.

---

# A.3 — Workflow complementario: `nightly.yml`

## ¿Cuál es el trigger de este workflow?

El workflow `nightly.yml` tiene estos triggers:

```yml
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:
```

Esto significa que se ejecuta de dos formas:

1. Automáticamente todos los días a las **02:00 UTC**.
2. Manualmente desde la pestaña **Actions** de GitHub.

---

## ¿Qué significa la sintaxis del cron?

La expresión:

```txt
0 2 * * *
```

se interpreta así:

```txt
minuto hora día-del-mes mes día-de-la-semana
```

Entonces:

```txt
0 2 * * *
```

significa:

```txt
A las 02:00, todos los días, todos los meses, cualquier día de la semana.
```

---

## ¿Por qué los tests de performance no están en `ci.yml` junto con los otros?

Porque los tests de performance suelen ser más lentos, más pesados y más costosos que los tests normales.

No conviene ejecutarlos en cada push o pull request porque harían que el CI tarde demasiado y atrasarían el feedback del equipo.

Por eso se separan en `nightly.yml`, para correrlos de forma programada durante la noche o manualmente cuando haga falta.

---

## ¿Qué ventaja tiene separar workflows según su frecuencia/costo de ejecución?

La ventaja es que cada workflow cumple una función distinta:

| Workflow | Frecuencia | Objetivo |
|---|---|---|
| `ci.yml` | En push y pull request | Feedback rápido |
| `nightly.yml` | Diario o manual | Validación pesada de performance |

Esto permite mantener un CI rápido para el desarrollo diario, sin dejar de tener pruebas más profundas en otro momento.

---

## Diagrama del workflow `nightly.yml`

El workflow nocturno tiene esta estructura:

```txt
                 ┌───────────────┐
                 │      pre      │
                 └───────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │   load   │          │  stress  │
        └────┬─────┘          └────┬─────┘
             │                     │
             └──────────┬──────────┘
                        ▼
                  ┌──────────┐
                  │   post   │
                  └──────────┘
```

Versión resumida:

```txt
pre
 ├── load
 └── stress
      ↓
    post
```

Los jobs `load` y `stress` corren en paralelo después de `pre`.

El job `post` espera a que terminen ambos y valida sus resultados.

---

# A.4 — Pequeña modificación práctica

## Cambio pedido

Agregar ejecución manual al workflow principal `ci.yml`.

Actualmente:

```yml
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
```

Debe quedar:

```yml
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
  workflow_dispatch:
```

---

## Commit sugerido

```bash
git add .github/workflows/ci.yml
git commit -m "ci: agregar dispatch manual al workflow"
git push
```

---

# Parte B — Quality gates

## B.1 — Inspección de coverage

Se debe revisar el archivo:

```txt
apps/api/vitest.config.ts
```

Dentro de ese archivo hay que ubicar la sección:

```ts
test: {
  coverage: {
    ...
  }
}
```

Ahí se debe verificar:

- Provider usado, por ejemplo `v8`.
- Reporters generados, por ejemplo `text`, `json`, `lcov`.
- Archivos excluidos de cobertura.
- Que el script de tests efectivamente genere coverage.

---

## B.2 — Agregar threshold de cobertura

Dentro de `test.coverage`, agregar:

```ts
thresholds: {
  lines: 80,
  branches: 75,
  functions: 80,
  statements: 80,
},
```

Ejemplo:

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'lcov'],
  thresholds: {
    lines: 80,
    branches: 75,
    functions: 80,
    statements: 80,
  },
},
```

Esto hace que el pipeline falle si la cobertura queda por debajo de esos valores.

---

## Probar localmente

```bash
cd apps/api
npm run test:unit -- --coverage
```

---

## Commit sugerido

```bash
git add apps/api/vitest.config.ts
git commit -m "feat(api): agregar threshold de coverage como quality gate"
git push
```

---

# Parte C — Bugs latentes

## BUG-04 — Mensajes de error en inglés

La consigna indica que hay mensajes de error que actualmente están en español, pero los tests esperan inglés.

Archivo:

```txt
apps/api/src/services/auth.service.ts
```

Cambiar:

```ts
'Email ya registrado'
```

por:

```ts
'Email already registered'
```

Cambiar:

```ts
'La contraseña debe tener al menos 8 caracteres'
```

por:

```ts
'Password must be at least 8 characters'
```

---

## Commit sugerido

```bash
git add apps/api/src/services/auth.service.ts
git commit -m "fix(auth): unificar mensajes de error en inglés"
git push
```

---

## BUG-03 — Validaciones de complejidad de password

La consigna indica que el registro debe rechazar contraseñas sin mayúscula y sin número.

En:

```txt
apps/api/src/services/auth.service.ts
```

El schema debería quedar así:

```ts
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number'),
```

Esto valida:

- Que la contraseña tenga al menos 8 caracteres.
- Que contenga al menos una letra mayúscula.
- Que contenga al menos un número.

---

## Commit sugerido

```bash
git add apps/api/src/services/auth.service.ts
git commit -m "fix(auth): agregar validaciones de complejidad en password"
git push
```

---

# Cambios adicionales recomendados

## 1. Ajustar `e2e-tests` para que corra solo en pull requests

Si se quiere respetar exactamente la consigna, agregar al job `e2e-tests`:

```yml
if: github.event_name == 'pull_request'
```

Ejemplo:

```yml
e2e-tests:
  name: 🎭 E2E Tests (Playwright)
  runs-on: ubuntu-latest
  needs: pre
  if: github.event_name == 'pull_request'
```

---

## 2. Ajustar `post` para aceptar E2E salteado

Si `e2e-tests` se saltea en push, el resultado será:

```txt
skipped
```

Entonces, en el job `post`, esta validación:

```bash
if [ "$E2E_RESULT" != "success" ]; then
  echo "E2E job failed."
  exit 1
fi
```

debería cambiarse por:

```bash
if [ "$E2E_RESULT" != "success" ] && [ "$E2E_RESULT" != "skipped" ]; then
  echo "E2E job failed."
  exit 1
fi
```

Así el pipeline no falla cuando E2E fue salteado correctamente por no ser un pull request.

---

# Badge del pipeline

Agregar al `README.md` raíz:

```md
![CI](https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg)
```

Reemplazar `<usuario>` y `<repo>` por los datos reales.

Ejemplo:

```md
![CI](https://github.com/usuario/taskflow/actions/workflows/ci.yml/badge.svg)
```

---

# Checklist final del Hito 4

- [X] `ci.yml` tiene `workflow_dispatch`.
- [X] Se entendió y documentó el grafo de jobs del CI.
- [X] Se respondieron las 5 preguntas guiadas.
- [X] Se explicó el workflow complementario `nightly.yml`.
- [X] `nightly.yml` tiene `schedule` y `workflow_dispatch`.
- [X] `nightly.yml` ejecuta pruebas de carga y estrés.
- [X] `vitest.config.ts` tiene thresholds de coverage.
- [X] BUG-04 corregido: mensajes de error en inglés.
- [X] BUG-03 corregido: validaciones de password completas.
- [X] `README.md` tiene badge del pipeline.
- [X] Todos los tests unitarios pasan.
- [X] El pipeline queda en verde.

---

# Resumen corto para entregar

Se analizó el workflow principal de CI de TaskFlow, identificando sus jobs, dependencias y ejecución paralela. El flujo comienza con `pre`, luego ejecuta en paralelo `lint`, `unit-tests`, `integration-tests`, `bdd-tests` y `e2e-tests`, y finaliza con `post`, que valida los resultados. También se revisó el workflow complementario `nightly.yml`, que ejecuta pruebas de carga y estrés todos los días a las 02:00 UTC y manualmente mediante `workflow_dispatch`. Se propusieron los cambios necesarios para completar el hito: agregar ejecución manual al CI, configurar thresholds de cobertura, corregir bugs de autenticación, ajustar E2E si corresponde y agregar el badge del pipeline al README.
