import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
    setupFiles: ['./tests/setup.ts'],
  },
})