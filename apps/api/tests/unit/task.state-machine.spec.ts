// tests/unit/task.state-machine.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as allure from 'allure-js-commons'
import { Severity } from 'allure-js-commons'
import { TaskService } from '../../src/services/task.service'
import { UnprocessableError } from '../../src/services/auth.service'

const mockMember = { userId: 'user-1', role: 'MEMBER' }

function makeTask(status: string, assignedTo = 'user-1') {
  return {
    id: 'task-1',
    title: 'Test task',
    status,
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assignedTo,
    project: { members: [mockMember] },
  }
}

const mockDb = {
  task: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  statusHistory: { create: vi.fn() },
  projectMember: { findUnique: vi.fn() },
}

const taskService = new TaskService(mockDb as any)

// ════════════════════════════════════════════════════════════════
// US-06: Máquina de estados
// ════════════════════════════════════════════════════════════════
describe('TaskService — máquina de estados (US-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.statusHistory.create.mockResolvedValue({})
    mockDb.task.update.mockResolvedValue({ id: 'task-1' })
  })

  describe('Transiciones VÁLIDAS', () => {
    it('TODO → IN_PROGRESS ✓', async () => {
      await allure.feature('Tareas')
      await allure.story('US-06')
      await allure.severity(Severity.CRITICAL)
      await allure.label('tag', 'severity: critical')
      await allure.link('https://github.com/juanchibruzzone/taskflow/issues/US-06', 'US-06')
      await allure.description(
          'Verifica que la máquina de estados permite la transición válida desde TODO hacia IN_PROGRESS.',
      )

      await allure.step('Preparar tarea en estado TODO', async () => {
        mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))
      })

      await allure.step('Actualizar estado a IN_PROGRESS', async () => {
        await expect(
            taskService.updateTask('task-1', 'user-1', { status: 'IN_PROGRESS' }),
        ).resolves.toBeDefined()
      })
    })

    it('IN_PROGRESS → DONE ✓', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('IN_PROGRESS'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'DONE' }),
      ).resolves.toBeDefined()
    })

    it('IN_PROGRESS → TODO ✓ (reabrir tarea en progreso)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('IN_PROGRESS'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'TODO' }),
      ).resolves.toBeDefined()
    })
  })

  describe('Transiciones INVÁLIDAS', () => {
    it('TODO → DONE ✗ (saltar IN_PROGRESS)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'DONE' }),
      ).rejects.toThrow(UnprocessableError)
    })

    it('TODO → DONE: mensaje de error describe la transición', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'DONE' }),
      ).rejects.toThrow('TODO → DONE')
    })

    it('DONE → TODO ✗ (no se puede reabrir una tarea cerrada)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('DONE'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'TODO' }),
      ).rejects.toThrow(UnprocessableError)
    })

    it('DONE → IN_PROGRESS ✗', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('DONE'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'IN_PROGRESS' }),
      ).rejects.toThrow(UnprocessableError)
    })

    it('mensaje de error DONE menciona que no hay transiciones permitidas', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('DONE'))

      await expect(
          taskService.updateTask('task-1', 'user-1', { status: 'TODO' }),
      ).rejects.toThrow('none')
    })
  })

  describe('Registro de historial', () => {
    it('registra la transición en statusHistory', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await taskService.updateTask('task-1', 'user-1', { status: 'IN_PROGRESS' })

      expect(mockDb.statusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          from: 'TODO',
          to: 'IN_PROGRESS',
          changedBy: 'user-1',
        }),
      })
    })

    it('no registra historial si el estado no cambia', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await taskService.updateTask('task-1', 'user-1', { title: 'Nuevo título' })

      expect(mockDb.statusHistory.create).not.toHaveBeenCalled()
    })
  })
})