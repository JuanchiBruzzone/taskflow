import type { TestInfo } from '@playwright/test'

/**
 * Email único entre workers paralelos (parallelIndex) y entre ejecuciones (timestamp).
 */
export function uniqueTestEmail(prefix: string, testInfo: TestInfo): string {
  const worker = testInfo.parallelIndex ?? 0
  return `${prefix}_w${worker}_${Date.now()}@test.com`
}
