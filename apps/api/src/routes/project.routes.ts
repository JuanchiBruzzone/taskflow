import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { ProjectService } from '../services/project.service'
import { TaskService } from '../services/task.service'
import { CommentService } from '../services/comment.service'
import { requireAuth, AuthRequest } from '../middleware/auth.middleware'
import { Status, Priority } from '@prisma/client'

const router = Router()

// Lazy initialization helpers so tests can mock service modules with vi.mock
function getPrisma() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client')
  return new PrismaClient()
}

function getProjectService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ProjectService } = require('../services/project.service')
  return new ProjectService(getPrisma())
}

function getTaskService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TaskService } = require('../services/task.service')
  return new TaskService(getPrisma())
}

function getCommentService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CommentService } = require('../services/comment.service')
  return new CommentService(getPrisma())
}

// ── Projects ──────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const projects = await getProjectService().listProjects(req.userId!)
    res.json(projects)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const project = await getProjectService().createProject(req.userId!, req.body)
    res.status(201).json(project)
  } catch (err) { next(err) }
})

router.get('/:projectId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const project = await getProjectService().getProject(req.params.projectId, req.userId!)
    res.json(project)
  } catch (err) { next(err) }
})

router.patch('/:projectId/archive', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const project = await getProjectService().archiveProject(req.params.projectId, req.userId!)
    res.json(project)
  } catch (err) { next(err) }
})

// ── Tasks ─────────────────────────────────────────────────────
router.get('/:projectId/tasks', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, assignedTo, search } = req.query
  const tasks = await getTaskService().getTasks(req.params.projectId, req.userId!, {
      status: status as Status | undefined,
      priority: priority as Priority | undefined,
      assignedTo: assignedTo as string | undefined,
      search: search as string | undefined,
    })
    res.json(tasks)
  } catch (err) { next(err) }
})

router.post('/:projectId/tasks', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const task = await getTaskService().createTask(req.params.projectId, req.userId!, req.body)
    res.status(201).json(task)
  } catch (err) { next(err) }
})

// ── Comments ──────────────────────────────────────────────────
router.get('/:projectId/tasks/:taskId/comments', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const comments = await getCommentService().getComments(req.params.taskId, req.userId!)
    res.json(comments)
  } catch (err) { next(err) }
})

router.post('/:projectId/tasks/:taskId/comments', requireAuth, async (req: AuthRequest, res, next) => {
  try {
  const comment = await getCommentService().addComment(req.params.taskId, req.userId!, req.body)
    res.status(201).json(comment)
  } catch (err) { next(err) }
})

export default router
