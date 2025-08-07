import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.test.*',
        '**/__tests__/**',
        '**/coverage/**',
        'dist/',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Separate test patterns for different types
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/tests/**/*.test.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'src/tests/e2e/**'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})