import { afterAll, beforeAll, describe, it } from 'vitest'
import { Verifier } from '@pact-foundation/pact'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'
import http from 'http'
import { createApp } from '../../src/app'
import { generateTestJWT } from '../helpers/auth.helper'
import type { Request, Response, NextFunction } from 'express'

const prisma = new PrismaClient()
let server: http.Server
let port: number

const PACT_USER_ID = 'pact-user-1'

beforeAll(async () => {
  // Clean slate
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Seed the user the pact state expects
  const passwordHash = await bcrypt.hash('PactPass1!', 10)
  await prisma.user.create({
    data: {
      id: PACT_USER_ID,
      email: 'pact@test.com',
      passwordHash,
      name: 'Pact User',
    },
  })

  // Start server on a random port
  const app = createApp()
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      port = (server.address() as { port: number }).port
      resolve()
    })
  })
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err: Error | undefined) => (err ? reject(err) : resolve())),
  )
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

describe('Pact provider verification — taskflow-api', () => {
  it('verifies the consumer contract', async () => {
    await new Verifier({
      provider: 'taskflow-api',
      providerBaseUrl: `http://localhost:${port}`,

      pactUrls: [
        path.resolve(process.cwd(), '../../pacts/taskflow-frontend-taskflow-api.json'),
      ],

      requestFilter: (req: Request, _res: Response, next: NextFunction) => {
        req.headers['authorization'] = `Bearer ${generateTestJWT(PACT_USER_ID)}`
        next()
      },

      stateHandlers: {
        'usuario autenticado con token válido': async () => {
          // User is already seeded in beforeAll; clean projects between verifications
          await prisma.task.deleteMany()
          await prisma.projectMember.deleteMany()
          await prisma.project.deleteMany()
        },
      },

      logLevel: 'warn',
    }).verifyProvider()
  })
})
