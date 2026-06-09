import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import * as allure from 'allure-js-commons'
import { Severity } from 'allure-js-commons'
import { createApp } from '../../src/app'

const prisma = new PrismaClient()
const app = createApp()

async function clearDatabase() {
  await prisma.comment.deleteMany()
  await prisma.statusHistory.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

describe('Proyectos API - US-03 y US-04', () => {
  let token: string
  let userId: string

  beforeAll(async () => {
    await clearDatabase()

    const res = await request(app)
        .post('/auth/register')
        .send({ email: 'tester@test.com', password: 'Test1234!', name: 'Tester' })

    token = res.body.token
    userId = res.body.user.id
  })

  beforeEach(async () => {
    await prisma.comment.deleteMany()
    await prisma.statusHistory.deleteMany()
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await clearDatabase()
    await prisma.$disconnect()
  })

  it('crea un proyecto y devuelve 201 con id (@US-03)', async () => {
    await allure.feature('Proyectos')
    await allure.story('US-03')
    await allure.severity(Severity.NORMAL)
    await allure.label('tag', 'severity: normal')
    await allure.link('https://github.com/juanchibruzzone/taskflow/issues/US-03', 'US-03')
    await allure.description(
        'Verifica que un usuario autenticado puede crear un proyecto con nombre y descripción válidos.',
    )

    const res = await allure.step('Enviar solicitud autenticada para crear proyecto', async () => {
      return request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'TaskFlow MVP', description: 'Primer sprint' })
    })

    await allure.step('Validar respuesta 201 y datos del proyecto', async () => {
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('TaskFlow MVP')
      expect(res.body.description).toBe('Primer sprint')
      expect(res.body.ownerId).toBe(userId)
    })
  })

  it('rechaza nombre vacio con 400 (@US-03)', async () => {
    const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', description: 'Sin nombre' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/validation/i)
  })

  it('rechaza peticion sin token con 401 (@US-03)', async () => {
    const res = await request(app)
        .post('/projects')
        .send({ name: 'Proyecto sin auth' })

    expect(res.status).toBe(401)
  })

  it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
    await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto de tester1' })

    const res2 = await request(app)
        .post('/auth/register')
        .send({ email: 'otro@test.com', password: 'Test1234!', name: 'Otro' })

    const token2 = res2.body.token

    const list = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${token2}`)

    expect(list.status).toBe(200)
    expect(Array.isArray(list.body)).toBe(true)
    expect(list.body).toHaveLength(0)
  })

  it('rechaza listado de proyectos con token invalido con 401 (@US-04)', async () => {
    const res = await request(app)
        .get('/projects')
        .set('Authorization', 'Bearer token-invalido')

    expect(res.status).toBe(401)
  })

  it('rechaza listado de proyectos sin token con 401 (@US-04)', async () => {
    const res = await request(app).get('/projects')

    expect(res.status).toBe(401)
  })

  it('CA-15 — solo proyectos donde el usuario es owner o miembro (segundo usuario no ve proyectos)', async () => {
    await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto de tester1' })

    const res2 = await request(app)
        .post('/auth/register')
        .send({ email: 'otro2@test.com', password: 'Test1234!', name: 'Otro2' })

    const token2 = res2.body.token

    const list2 = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${token2}`)

    expect(list2.status).toBe(200)
    expect(Array.isArray(list2.body)).toBe(true)
    expect(list2.body).toHaveLength(0)
  })
})