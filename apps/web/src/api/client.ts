import axios from 'axios'
import type { Project, Task, Comment } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ token: string }>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string }>('/auth/login', data).then((r) => r.data),
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects', data).then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
}

export const tasksApi = {
  list: (projectId: string, params?: { status?: string; search?: string }) =>
    api.get<Task[]>(`/projects/${projectId}/tasks`, { params }).then((r) => r.data),
  create: (projectId: string, data: { title: string; description?: string; priority: string }) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),
  update: (taskId: string, data: { status?: string; assignedTo?: string }) =>
    api.patch<Task>(`/tasks/${taskId}`, data).then((r) => r.data),
}

export const commentsApi = {
  list: (projectId: string, taskId: string) =>
    api.get<Comment[]>(`/projects/${projectId}/tasks/${taskId}/comments`).then((r) => r.data),
  create: (projectId: string, taskId: string, data: { body: string }) =>
    api.post<Comment>(`/projects/${projectId}/tasks/${taskId}/comments`, data).then((r) => r.data),
}
