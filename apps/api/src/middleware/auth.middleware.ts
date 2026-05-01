import { Request, Response, NextFunction } from 'express'
// Defer requiring AuthService and PrismaClient so tests can mock the service module
// by replacing the exported symbols. Constructing the real AuthService at module
// load time prevents vi.mock from taking effect in tests.
function getAuthService() {
  // require here so vitest's module mocking can replace ../services/auth.service
  // with a mock implementation during tests.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AuthService } = require('../services/auth.service')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  return new AuthService(prisma)
}

export interface AuthRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const authService = getAuthService()
    const payload = authService.verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

interface HttpError extends Error {
  statusCode?: number
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const httpErr = err as HttpError
  const status = httpErr.statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message

  if (status === 500) console.error(err)

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: JSON.parse(err.message) })
  }

  return res.status(status).json({ error: message })
}
