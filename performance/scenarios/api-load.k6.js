// performance/scenarios/api-load.k6.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('error_rate')
const tasksDuration = new Trend('tasks_list_duration', true)

const scenarios = {
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '30s', target: 0 },
    ],
    tags: { scenario: 'load' },
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 200 },
      { duration: '30s', target: 200 },
      { duration: '10s', target: 0 },
    ],
    tags: { scenario: 'stress' },
  },
}

const selectedScenario = __ENV.SCENARIO || 'load'
const thresholds = selectedScenario === 'stress'
  ? {
    http_req_duration: ['p(95)<5000', 'p(99)<15000'],
    error_rate: ['rate<0.05'],
    tasks_list_duration: ['p(95)<5000'],
  }
  : {
    http_req_duration: ['p(95)<1000', 'p(99)<2500'],
    error_rate: ['rate<0.01'],
    tasks_list_duration: ['p(95)<1000'],
  }

export const options = {
  thresholds,
  scenarios: {
    [selectedScenario]: scenarios[selectedScenario] || scenarios.load,
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

export function setup() {
  const email = `perf-${Date.now()}@test.com`
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email,
    password: 'Password1',
    name: 'Perf User',
  }), { headers: { 'Content-Type': 'application/json' } })

  const token = registerRes.json('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const projectRes = http.post(`${BASE_URL}/projects`, JSON.stringify({
    name: `Performance ${Date.now()}`,
    description: 'k6 nightly performance project',
  }), { headers })

  const projectId = projectRes.json('id')
  if (projectId) {
    http.post(`${BASE_URL}/projects/${projectId}/tasks`, JSON.stringify({
      title: 'Performance baseline task',
      priority: 'HIGH',
    }), { headers })
  }

  return { projectId, token, userId: registerRes.json('user.id') }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  }

  const projectsRes = http.get(`${BASE_URL}/projects`, { headers })
  check(projectsRes, { 'projects status 200': (r) => r.status === 200 })
  errorRate.add(projectsRes.status !== 200)

  sleep(0.3)

  const projectId = data.projectId || projectsRes.json('0.id')
  if (projectId) {
    const tasksRes = http.get(`${BASE_URL}/projects/${projectId}/tasks?status=TODO`, { headers })
    tasksDuration.add(tasksRes.timings.duration)
    errorRate.add(tasksRes.status !== 200)
    check(tasksRes, { 'tasks status 200': (r) => r.status === 200 })
  }

  sleep(1)
}
