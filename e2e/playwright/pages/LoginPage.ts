import { expect, type Page } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async register(email: string, password: string, name: string): Promise<void> {
    await this.page.goto('/register')
    await this.page.getByTestId('register-name').fill(name)
    await this.page.getByTestId('register-email').fill(email)
    await this.page.getByTestId('register-password').fill(password)
    await this.page.getByRole('button', { name: 'Registrarse' }).click()
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto()
    await this.page.getByTestId('login-email').fill(email)
    await this.page.getByTestId('login-password').fill(password)
    await this.page.getByRole('button', { name: 'Entrar' }).click()
  }

  async expectRedirectToProjects(): Promise<void> {
    await expect(this.page).toHaveURL('/projects')
  }

  async expectRedirectToLogin(): Promise<void> {
    await expect(this.page).toHaveURL('/login')
  }

  async expectRegisterError(text: string | RegExp): Promise<void> {
    await expect(this.page.getByTestId('register-error')).toContainText(text)
  }

  async expectLoginError(text: string | RegExp): Promise<void> {
    await expect(this.page.getByTestId('login-error')).toContainText(text)
  }
}
