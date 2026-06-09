import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,

    include: [
      'apps/api/tests/**/*.{test,spec}.ts',
      'apps/web/tests/pact/**/*.{test,spec}.ts',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'allure-results/**',
      'allure-report/**',

      'mobile/**',
      'e2e/**',
      '**/*.e2e.spec.ts',
      '**/*.e2e.test.ts',
    ],

    reporters: [
      'default',
      [
        'allure-vitest/reporter',
        {
          resultsDir: 'allure-results',
        },
      ],
    ],

    setupFiles: [
      'apps/api/tests/setup.ts',
      'allure-vitest/setup',
    ],
  },
})