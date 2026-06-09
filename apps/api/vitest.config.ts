import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,

    include: [
      'tests/**/*.{test,spec}.ts',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'allure-results/**',
      'allure-report/**',
      '../../mobile/**',
      '../../e2e/**',
      '**/*.e2e.spec.ts',
      '**/*.e2e.test.ts',
    ],

    reporters: [
      'default',
      [
        'allure-vitest/reporter',
        {
          resultsDir: '../../allure-results',
        },
      ],
    ],

    setupFiles: [
      './tests/setup.ts',
      'allure-vitest/setup',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/prisma/**',
        'dist/**',
        '**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/services/comment.service.ts',
        'src/services/project.service.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 70,
        statements: 60,
      },
    },
  },
})