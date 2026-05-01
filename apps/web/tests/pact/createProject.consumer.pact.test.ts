import { describe, it, expect } from 'vitest'
import { PactV4, MatchersV3 } from '@pact-foundation/pact'
import path from 'path'
import { createProject } from '../../src/api/projects'

const { string } = MatchersV3

const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  dir: path.resolve(__dirname, '../../../../pacts'),
})

describe('Consumer Pact - createProject', () => {
  it("POST /api/projects devuelve 201 con id, name y ownerId", async () => {
    await provider
      .addInteraction()
      .given('usuario autenticado con token válido')
      .uponReceiving('una petición para crear proyecto TaskFlow MVP')
      .withRequest('POST', '/api/projects', (builder) => {
        builder.headers({ 'Content-Type': 'application/json', Authorization: 'Bearer token-de-test' })
        builder.jsonBody({
          name: string('TaskFlow MVP'),
          description: string('desc'),
        })
        return builder
      })
      .willRespondWith(201, (builder) => {
        builder.jsonBody({
          id: string('proj-1'),
          name: string('TaskFlow MVP'),
          ownerId: string('user-1'),
        })
        return builder
      })

      .executeTest(async (mockServer) => {
        const result = await createProject(mockServer.url, 'TaskFlow MVP', 'desc', 'token-de-test')
        expect(result.id).toBeDefined()
        expect(result.name).toBe('TaskFlow MVP')
      })
  })
})
