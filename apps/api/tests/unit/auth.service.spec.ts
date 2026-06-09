// tests/unit/auth.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as allure from 'allure-js-commons'
import { Severity } from 'allure-js-commons'
import { AuthService, ConflictError, UnauthorizedError } from '../../src/services/auth.service'

// ── Mock PrismaClient ────────────────────────────────────────────
const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const authService = new AuthService(mockDb as any)

// ── Helpers ──────────────────────────────────────────────────────
const validRegisterInput = {
  email: 'ana@test.com',
  password: 'Password1',
  name: 'Ana',
}

const mockUser = {
  id: 'user-1',
  email: 'ana@test.com',
  passwordHash: '$2a$12$hashedpassword',
  name: 'Ana',
  failedLogins: 0,
  lockedUntil: null,
  createdAt: new Date(),
}

// ════════════════════════════════════════════════════════════════
// US-01: Registro de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.register — US-01', () => {
  describe('Criterio 1: email con formato válido', () => {
    it('rechaza email sin @', async () => {
      await expect(
          authService.register({ ...validRegisterInput, email: 'notanemail' }),
      ).rejects.toThrow()
    })

    it('rechaza email sin dominio', async () => {
      await expect(
          authService.register({ ...validRegisterInput, email: 'user@' }),
      ).rejects.toThrow()
    })

    it('acepta email válido', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      const result = await authService.register(validRegisterInput)
      expect(result.user.email).toBe('ana@test.com')
    })
  })

  describe('Criterio 2: contraseña con requisitos de seguridad', () => {
    it('rechaza contraseña menor a 8 caracteres', async () => {
      await expect(
          authService.register({ ...validRegisterInput, password: 'Abc1' }),
      ).rejects.toThrow('at least 8 characters')
    })

    it('rechaza contraseña sin mayúscula', async () => {
      await expect(
          authService.register({ ...validRegisterInput, password: 'password1' }),
      ).rejects.toThrow('uppercase')
    })

    it('rechaza contraseña sin número', async () => {
      await expect(
          authService.register({ ...validRegisterInput, password: 'Password' }),
      ).rejects.toThrow('number')
    })

    it('acepta contraseña válida con mayúscula y número', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      await expect(
          authService.register({ ...validRegisterInput, password: 'SecurePass1' }),
      ).resolves.toBeDefined()
    })
  })

  describe('Criterio 3: email único', () => {
    it('lanza ConflictError si el email ya existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      await expect(
          authService.register(validRegisterInput),
      ).rejects.toThrow(ConflictError)

      await expect(
          authService.register(validRegisterInput),
      ).rejects.toThrow('Email already registered')
    })

    it('llama a findUnique con el email correcto', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      try {
        await authService.register(validRegisterInput)
      } catch {
        // expected error
      }

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ana@test.com' },
      })
    })
  })

  describe('Criterio 4: retorna JWT al registrarse', () => {
    it('incluye token en la respuesta exitosa', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      const result = await authService.register(validRegisterInput)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.token.split('.')).toHaveLength(3)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// US-02: Login de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.login — US-02', () => {
  describe('Criterio 1: login exitoso retorna JWT', () => {
    it('retorna token para credenciales válidas', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      const result = await authService.login({ email: 'ana@test.com', password: 'Password1' })

      expect(result.token).toBeDefined()
      expect(result.user.email).toBe('ana@test.com')
    })

    it('el token generado incluye campo de expiración (exp) — BUG-07', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      const result = await authService.login({ email: 'ana@test.com', password: 'Password1' })

      const decoded = jwt.decode(result.token) as any

      expect(decoded.exp).toBeDefined()
    })
  })

  describe('Criterio 2: credenciales incorrectas', () => {
    it('lanza UnauthorizedError con password incorrecto', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({})

      await expect(
          authService.login({ email: 'ana@test.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedError)
    })

    it('lanza UnauthorizedError si el usuario no existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      await expect(
          authService.login({ email: 'noexiste@test.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('Criterio 3: bloqueo por intentos fallidos', () => {
    it('bloquea la cuenta después de 5 intentos fallidos — BUG-05', async () => {
      await allure.feature('Autenticación')
      await allure.story('BUG-05')
      await allure.severity(Severity.CRITICAL)
      await allure.label('tag', 'severity: critical')
      await allure.link('https://github.com/juanchibruzzone/taskflow/issues/BUG-05', 'BUG-05')
      await allure.description(
          'Verifica que el servicio de autenticación bloquea una cuenta luego de alcanzar el límite de intentos fallidos.',
      )

      const hash = await bcrypt.hash('Password1', 12)

      await allure.step('Preparar usuario con 5 intentos fallidos acumulados', async () => {
        mockDb.user.findUnique.mockResolvedValue({
          ...mockUser,
          passwordHash: hash,
          failedLogins: 5,
          lockedUntil: null,
        })
        mockDb.user.update.mockResolvedValue({})
      })

      await allure.step('Intentar login con contraseña incorrecta', async () => {
        await expect(
            authService.login({ email: 'ana@test.com', password: 'WrongPass1' }),
        ).rejects.toThrow(UnauthorizedError)
      })

      await allure.step('Verificar que se establece lockedUntil', async () => {
        const updateCall = mockDb.user.update.mock.calls[0][0]
        expect(updateCall.data.lockedUntil).toBeDefined()
      })
    })

    it('respeta el bloqueo si lockedUntil está en el futuro', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      })

      await expect(
          authService.login({ email: 'ana@test.com', password: 'Password1' }),
      ).rejects.toThrow('locked')
    })
  })
})