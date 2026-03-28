import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskService } from '../../src/services/task.service'
import { Status as TaskStatus } from '@prisma/client'
import { AuthService } from '../../src/services/auth.service'
import bcrypt from 'bcryptjs'

// Mock bcrypt
vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn(),
    },
}))

// ─────────────────────────────────────────────────────────────
// EJERCICIO 1
// ─────────────────────────────────────────────────────────────
describe('TaskService.validateTitle', () => {
    const svc = new TaskService({} as any)

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debe lanzar error si el título tiene menos de 3 caracteres', () => {
        expect(() => svc.validateTitle('ab')).toThrow(
            'El título debe tener al menos 3 caracteres'
        )
    })

    it('debe lanzar error si el título tiene más de 100 caracteres', () => {
        expect(() => svc.validateTitle('a'.repeat(101))).toThrow(
            'El título no puede superar los 100 caracteres'
        )
    })

    it('debe lanzar error si el título está vacío', () => {
        expect(() => svc.validateTitle('')).toThrow(
            'El título no puede estar vacío'
        )
    })

    it('debe lanzar error si el título contiene solo espacios en blanco', () => {
        expect(() => svc.validateTitle('   ')).toThrow(
            'El título no puede estar vacío'
        )
    })

    it('debe aceptar un título válido sin lanzar error', () => {
        expect(() => svc.validateTitle('Mi tarea')).not.toThrow()
    })

    it('debe aceptar título con exactamente 3 caracteres', () => {
        expect(() => svc.validateTitle('abc')).not.toThrow()
    })

    it('debe aceptar título con exactamente 100 caracteres', () => {
        expect(() => svc.validateTitle('a'.repeat(100))).not.toThrow()
    })
})

// ─────────────────────────────────────────────────────────────
// EJERCICIO 2
// ─────────────────────────────────────────────────────────────
describe('TaskService.validateStatusTransition', () => {
    const svc = new TaskService({} as any)

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('permite TODO → IN_PROGRESS', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.TODO, TaskStatus.IN_PROGRESS)
        ).not.toThrow()
    })

    it('permite IN_PROGRESS → DONE', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.IN_PROGRESS, TaskStatus.DONE)
        ).not.toThrow()
    })

    it('rechaza TODO → DONE', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.TODO, TaskStatus.DONE)
        ).toThrow('Transición de estado inválida: TODO → DONE')
    })

    it('rechaza IN_PROGRESS → TODO', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.IN_PROGRESS, TaskStatus.TODO)
        ).toThrow('Transición de estado inválida: IN_PROGRESS → TODO')
    })

    it('rechaza DONE → cualquier estado', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.DONE, TaskStatus.TODO)
        ).toThrow('Transición de estado inválida: DONE → TODO')
    })

    it('rechaza transición al mismo estado', () => {
        expect(() =>
            svc.validateStatusTransition(TaskStatus.TODO, TaskStatus.TODO)
        ).toThrow('Transición de estado inválida: TODO → TODO')
    })
})

// ─────────────────────────────────────────────────────────────
// EJERCICIO 3
// ─────────────────────────────────────────────────────────────
describe('AuthService.login — bloqueo de cuenta', () => {
    const mockDb = {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    }

    const authSvc = new AuthService(mockDb as any)

    function makeUser(failedLogins: number, lockedUntil: Date | null = null) {
        return {
            id: 'u1',
            email: 'test@test.com',
            passwordHash: 'hash',
            failedLogins,
            lockedUntil,
        }
    }

    async function runFailedLogin(user: any) {
        mockDb.user.findUnique.mockResolvedValue(user)

        mockDb.user.update.mockImplementation(async (args) => {
            Object.assign(user, args.data)
            return user
        })

        ;(bcrypt.compare as any).mockResolvedValue(false)

        await expect(
            authSvc.login({ email: user.email, password: 'wrong' })
        ).rejects.toThrow()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('1 intento fallido → failedLogins=1, no bloqueado', async () => {
        const user = makeUser(0)

        await runFailedLogin(user)

        expect(user.failedLogins).toBe(1)
        expect(user.lockedUntil).toBeNull()
    })

    it('4 intentos fallidos → failedLogins=4, no bloqueado', async () => {
        const user = makeUser(3)

        await runFailedLogin(user)

        expect(user.failedLogins).toBe(4)
        expect(user.lockedUntil).toBeNull()
    })

    it('5 intentos fallidos → DEBE bloquear (BUG)', async () => {
        const user = makeUser(4)

        await runFailedLogin(user)

        expect(user.failedLogins).toBe(5)
        expect(user.lockedUntil).not.toBeNull()
    })

    it('si ya está bloqueado, no debe actualizar', async () => {
        const user = makeUser(5, new Date(Date.now() + 100000))

        mockDb.user.findUnique.mockResolvedValue(user)

        await expect(
            authSvc.login({ email: user.email, password: 'wrong' })
        ).rejects.toThrow()

        expect(mockDb.user.update).not.toHaveBeenCalled()
    })
})