import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import * as allure from 'allure-js-commons'
import { Severity } from 'allure-js-commons'

const prisma = new PrismaClient()
const app = createApp()

describe('Tareas API - US-05', () => {
  let token: string
  let projectId: string

  beforeAll(async () => {
    const res = await request(app)
        .post('/auth/register')
        .send({ email: 'tester-tasks@test.com', password: 'Test1234!', name: 'Tester Tasks' })

    token = res.body.token
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()

    const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto para tareas' })

    projectId = res.body.id
  })

  afterAll(async () => {
    await prisma.statusHistory.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  it('crea una tarea con prioridad válida (@US-05 CA-18)', async () => {
    await allure.feature('Tareas')
    await allure.story('US-05')
    await allure.severity(Severity.NORMAL)
    await allure.label('tag', 'severity: normal')
    await allure.link('https://github.com/juanchibruzzone/taskflow/issues/US-05', 'US-05')
    await allure.description(
        'Verifica que un usuario autenticado puede crear una tarea con prioridad válida dentro de un proyecto existente.',
    )

    const res = await allure.step('Crear tarea con prioridad HIGH', async () => {
      return request(app)
          .post(`/projects/${projectId}/tasks`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Implementar login', priority: 'HIGH', status: 'TODO' })
    })

    await allure.step('Validar respuesta 201 y prioridad de la tarea', async () => {
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.priority).toBe('HIGH')
    })
  })

  it('rechaza prioridad inválida con 400 (@US-05 CA-20)', async () => {
    const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Tarea mala', priority: 'ULTRA', status: 'TODO' })

    expect(res.status).toBe(400)
  })

  it('rechaza crear tarea sin token con 401 (@US-05)', async () => {
    const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .send({ title: 'Implementar login', priority: 'HIGH', status: 'TODO' })

    expect(res.status).toBe(401)
  })
})