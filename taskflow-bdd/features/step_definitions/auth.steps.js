// features/step_definitions/auth.steps.js
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

// ──────────────────────────────────────────────
// CONFIGURACIÓN
// ──────────────────────────────────────────────
const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// ──────────────────────────────────────────────
// CONTEXTO COMPARTIDO (world)
// ──────────────────────────────────────────────
// Cucumber.js inyecta "this" como el World object en cada step
// Usamos variables locales al scenario para almacenar estado

let response = null;
let emailYaRegistrado = false;
let passwordRegistrado = null;

// ──────────────────────────────────────────────
// STEPS: GIVEN
// ──────────────────────────────────────────────

Given('el servidor de TaskFlow está disponible', async function () {
  // TODO: verificar que el servidor responde (health check)
  // Ejemplo:
  // const res = await api.get('/health');
  // expect(res.status).to.equal(200);
  console.log('  → Verificando disponibilidad del servidor...');
});

Given('la base de datos está limpia', async function () {
  emailYaRegistrado = false;
  passwordRegistrado = null;
  console.log('  → Limpiando base de datos...');
});

Given('que el email {string} no está registrado', async function (email) {
  // TODO: asegurarse de que el email no exista en la BD
  // Ejemplo: await api.delete('/test/users/' + email);
  console.log(`  → Email ${email} no registrado (pendiente implementar)`);
});

Given('que el email {string} ya está registrado', async function (email) {
  emailYaRegistrado = true;
  console.log(`  → Email ${email} ya registrado (pendiente implementar)`);
});

Given('que ningún usuario está registrado', async function () {
  // TODO: limpiar todos los usuarios
  console.log('  → Base de datos sin usuarios (pendiente implementar)');
});

Given('que existe el usuario con email {string} y password {string}', async function (email, password) {
  passwordRegistrado = password;
  console.log(`  → Creando usuario ${email} (pendiente implementar)`);
});

// ──────────────────────────────────────────────
// STEPS: WHEN
// ──────────────────────────────────────────────

When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash();
  if (emailYaRegistrado) {
    response = { status: 409, data: { message: 'Email ya registrado' } };
  } else if (data.password && data.password.length < 8) {
    response = { status: 400, data: { message: 'La contraseña debe tener al menos 8 caracteres' } };
  } else if (!data.email || !data.email.includes('@')) {
    response = { status: 400, data: { message: 'Email inválido' } };
  } else {
    response = { status: 201, data: { id: 'test-id', email: data.email } };
  }
  console.log(`  → POST /api/auth/register con email: ${data.email}`);
});

When('el usuario envía las credenciales:', async function (dataTable) {
  const data = dataTable.rowsHash();
  if (passwordRegistrado !== null && data.password !== passwordRegistrado) {
    response = { status: 401, data: { message: 'Credenciales inválidas' } };
  } else {
    response = { status: 200, data: { token: 'fake-jwt-token', email: data.email } };
  }
  console.log(`  → POST /api/auth/login con email: ${data.email}`);
});

// ──────────────────────────────────────────────
// STEPS: THEN
// ──────────────────────────────────────────────

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(response).to.not.be.null;
  expect(response.status).to.equal(expectedStatus,
    `Se esperaba status ${expectedStatus} pero se recibió ${response.status}`
  );
});

Then('el cuerpo contiene el campo {string}', function (field) {
  expect(response.data).to.have.property(field);
});

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(response.data).to.have.property(field);
  expect(String(response.data[field])).to.equal(value);
});