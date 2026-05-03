import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import assert from 'assert'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../../../src/app'

setDefaultTimeout(15_000)

const prisma = new PrismaClient()
const app = createApp()

// ── World state ───────────────────────────────────────────
let response: request.Response
let token: string
let userId: string
let token2: string
let projectId: string

// ── DB cleanup ────────────────────────────────────────────
async function cleanDb() {
  await prisma.statusHistory.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

After(async () => {
  await cleanDb()
})

// ── Given ─────────────────────────────────────────────────

Given('la base de datos está limpia', async () => {
  await cleanDb()
})

Given(
  'existe un usuario registrado con email {string} y password {string}',
  async (email: string, password: string) => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'BDD User' })
    assert.strictEqual(res.status, 201, `Register failed: ${JSON.stringify(res.body)}`)
    token = res.body.token
    userId = res.body.user.id
  },
)

Given(
  'existe un segundo usuario registrado con email {string} y password {string}',
  async (email: string, password: string) => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'BDD User 2' })
    assert.strictEqual(res.status, 201, `Register user2 failed: ${JSON.stringify(res.body)}`)
    token2 = res.body.token
  },
)

Given(
  'el usuario autenticado tiene un proyecto llamado {string}',
  async (name: string) => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
    assert.strictEqual(res.status, 201, `Create project failed: ${JSON.stringify(res.body)}`)
    projectId = res.body.id
  },
)

// ── When ──────────────────────────────────────────────────

When(
  'el usuario autenticado crea un proyecto con nombre {string}',
  async (name: string) => {
    response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
    projectId = response.body.id
  },
)

When(
  'un usuario sin token intenta crear un proyecto con nombre {string}',
  async (name: string) => {
    response = await request(app).post('/projects').send({ name })
  },
)

When('el segundo usuario lista sus proyectos', async () => {
  response = await request(app)
    .get('/projects')
    .set('Authorization', `Bearer ${token2}`)
})

When(
  'el usuario autenticado crea una tarea con título {string} y prioridad {string}',
  async (title: string, priority: string) => {
    response = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title, priority })
  },
)

// ── Then ──────────────────────────────────────────────────

Then('la respuesta tiene status {int}', (expectedStatus: number) => {
  assert.strictEqual(
    response.status,
    expectedStatus,
    `Expected ${expectedStatus} but got ${response.status}. Body: ${JSON.stringify(response.body)}`,
  )
})

Then('la respuesta contiene el campo {string}', (field: string) => {
  assert.ok(
    response.body[field] !== undefined,
    `Expected field "${field}" in body: ${JSON.stringify(response.body)}`,
  )
})

Then('la respuesta contiene el campo {string} con valor {string}', (field: string, value: string) => {
  assert.strictEqual(
    String(response.body[field]),
    value,
    `Expected ${field}="${value}" but got "${response.body[field]}"`,
  )
})

Then('la respuesta contiene el campo {string} del usuario autenticado', (field: string) => {
  assert.strictEqual(
    response.body[field],
    userId,
    `Expected ${field}="${userId}" but got "${response.body[field]}"`,
  )
})

Then('la lista de proyectos no contiene {string}', (projectName: string) => {
  const names: string[] = (response.body as Array<{ name: string }>).map((p) => p.name)
  assert.ok(
    !names.includes(projectName),
    `Project list should not contain "${projectName}" but got: ${JSON.stringify(names)}`,
  )
})
