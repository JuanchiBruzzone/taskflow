import { expect, test } from '@playwright/test'

import { uniqueTestEmail } from '../helpers/uniqueTestEmail'
import { LoginPage } from '../pages/LoginPage'

test.describe('Autenticación', () => {
  test('US-01: registro exitoso redirige a /login', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page)
    const email = uniqueTestEmail('user', testInfo)

    await loginPage.register(email, 'Password1', 'Test User')
    await loginPage.expectRedirectToLogin()
  })

  test('US-01: registro muestra error con password débil', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page)
    const email = uniqueTestEmail('weak', testInfo)

    await loginPage.register(email, 'abc', 'Test User')
    await expect(page).toHaveURL(/\/register/)
    await loginPage.expectRegisterError(/Error al registrarse/)
  })

  test('US-02: login exitoso redirige a /projects', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page)
    const email = uniqueTestEmail('login', testInfo)

    await loginPage.register(email, 'Password1', 'Test User')
    await loginPage.expectRedirectToLogin()
    await loginPage.login(email, 'Password1')
    await loginPage.expectRedirectToProjects()
  })

  test('US-02: login inválido muestra error', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page)
    const email = uniqueTestEmail('badlogin', testInfo)

    await loginPage.register(email, 'Password1', 'Test User')
    await loginPage.expectRedirectToLogin()
    await loginPage.login(email, 'WrongPass1')
    await expect(page).toHaveURL('/login')
    await loginPage.expectLoginError(/Error al iniciar sesión/)
  })
})
