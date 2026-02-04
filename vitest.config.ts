import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    environment: 'node',
    hookTimeout: 20000,
    exclude: [...defaultExclude.filter(val => val !== '**/cypress/**'), '**/templates/**', '**/resources/**'],
    setupFiles: ['./vitest.test-setup.ts'],
    clearMocks: true,
  },
});
