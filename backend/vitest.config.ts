import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      MAX_BODY_MB: '1',
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dp:dp@localhost:5432/dp_test',
    },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
