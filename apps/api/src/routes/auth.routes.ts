import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth.service'

const router = Router()
const prisma = new PrismaClient()

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const authService = new AuthService(prisma)
    const result = await authService.register(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const authService = new AuthService(prisma)
    const result = await authService.login(req.body)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

export default router