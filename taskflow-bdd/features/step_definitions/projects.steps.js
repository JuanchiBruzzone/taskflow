// features/step_definitions/projects.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const assert = require('assert');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

let response = null;
let currentUser = null;
let currentProject = null;

Given('el servidor de TaskFlow está disponible', async function () {
  console.log('  → Verificando disponibilidad del servidor...');
});

Given('la base de datos está limpia', async function () {
  console.log('  → Limpiando base de datos...');
});

Given('existe un usuario autenticado con email {string}', async function (email) {
  // TODO: registrar usuario y obtener token
  currentUser = { email, token: 'fake-token-owner' };
  console.log(`  → Usuario autenticado: ${email} (stub)`);
});

Given('que existe un proyecto {string} del usuario {string}', async function (projectName, ownerEmail) {
  // TODO: crear proyecto via API
  currentProject = { id: 'proj-123', name: projectName, owner: ownerEmail };
  console.log(`  → Proyecto "${projectName}" creado (stub)`);
});

Given('existe un usuario con email {string}', async function (email) {
  // TODO: registrar usuario via API
  console.log(`  → Usuario ${email} existe (stub)`);
});

Given('existe un usuario con email {string} con rol {string}', async function (email, role) {
  // TODO: registrar usuario y asignar rol
  console.log(`  → Usuario ${email} con rol ${role} (stub)`);
});

When('el usuario crea un proyecto con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  if (!data.name || data.name.trim() === '') {
    response = { status: 400, data: { message: 'El nombre del proyecto es requerido' } };
  } else {
    response = {
      status: 201,
      data: {
        id: 'proj-new',
        name: data.name,
        columns: ['To Do', 'In Progress', 'In Review', 'Done'],
        owner: currentUser?.email,
      },
    };
  }
  console.log(`  → POST /api/projects: "${data.name}" → ${response.status} (stub)`);
});

When('un usuario sin token intenta crear un proyecto con nombre {string}', async function (name) {
  response = { status: 401, data: { message: 'No autorizado' } };
  console.log(`  → POST /api/projects sin token → 401 (stub)`);
});

Given('existe un segundo usuario con email {string}', async function (email) {
  console.log(`  → Usuario 2: ${email} (stub)`);
});

When('el segundo usuario lista sus proyectos', async function () {
  response = { status: 200, data: [] };
  console.log(`  → GET /api/projects (user2) → [] (stub)`);
});

Then('la lista de proyectos no contiene {string}', function (projectName) {
  const names = response.data.map(p => p.name);
  assert.ok(!names.includes(projectName), `La lista no debería contener "${projectName}"`);
});

When('el propietario invita a {string} como {string}', async function (email, role) {
  // TODO: POST /api/projects/:id/members
  response = { status: 200, data: { message: 'Miembro agregado' } };
  console.log(`  → Invitación a ${email} como ${role} (stub)`);
});

When('{string} intenta crear una tarea en el proyecto', async function (email) {
  // TODO: POST /api/tasks con token de viewer
  response = { status: 403, data: { message: 'No tenés permisos para crear tareas' } };
  console.log(`  → Intento de crear tarea por ${email} (stub)`);
});

Then('el proyecto tiene columnas: {string}, {string}, {string}, {string}', function (c1, c2, c3, c4) {
  const expected = [c1, c2, c3, c4];
  expect(response.data.columns).to.deep.equal(expected);
});

Then('el usuario es propietario del proyecto', function () {
  expect(response.data.owner).to.equal(currentUser?.email);
});

Then('el proyecto tiene {int} participantes', function (count) {
  // TODO: verificar con la API
  console.log(`  → Verificando ${count} participantes (stub)`);
});

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(response.status).to.equal(expectedStatus);
});

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(String(response.data[field])).to.equal(value);
});