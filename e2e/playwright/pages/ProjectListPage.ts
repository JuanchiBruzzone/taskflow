import { expect, type Page } from '@playwright/test'

export class ProjectListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/projects')
  }

  async createProject(name: string): Promise<void> {
    await this.page.getByTestId('create-project-btn').click()
    await this.page.getByTestId('project-name-input').fill(name)
    await this.page.getByTestId('project-submit').click()
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.page.getByTestId('project-name-input')).toBeVisible()
  }

  async expectProjectVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible()
  }

  async expectProjectCount(count: number): Promise<void> {
    await expect(this.page.getByTestId('project-card')).toHaveCount(count)
  }
}
