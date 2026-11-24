/**
 * Environment configuration loader and Zod validator.
 * Reads `.env` from repository root or `backend/.env`, validates required database/auth settings,
 * and exports typed runtime configuration consumed across Express routes and DB pooling.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '../.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z
    .string()
    .default(process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neondb')
    .refine((v) => /^postgres(ql)?:\/\//.test(v), 'DATABASE_URL must be a postgres:// URL'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOWED_ORIGINS: z.string().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  MAX_BODY_MB: z.coerce.number().positive().max(200).default(25),
  CSP_MODE: z.enum(['enforce', 'report-only', 'off']).default('enforce'),
  AUTO_MIGRATE: bool.default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  GEMINI_API_KEY: z.string().optional(),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`);
    // eslint-disable-next-line no-console
    console.error(`\n[config] Invalid environment configuration:\n${lines.join('\n')}\n` +
      `Copy .env.example to .env and fill in the required values.\n`);
    process.exit(1);
  }
  const env = parsed.data;

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.error('[config] JWT_SECRET is required in production (min 32 chars). Generate one with: openssl rand -hex 48');
      process.exit(1);
    }
    jwtSecret = crypto.randomBytes(48).toString('hex');
    // eslint-disable-next-line no-console
    console.warn('[config] JWT_SECRET not set - using an ephemeral secret. Sessions reset on every restart.');
  }

  const isDev = env.NODE_ENV !== 'production';
  const effectivePort = isDev ? 3000 : (Number(env.PORT) || 3000);

  return {
    nodeEnv: env.NODE_ENV,
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    port: effectivePort,
    host: env.HOST,
    databaseUrl: env.DATABASE_URL,
    databasePoolMax: env.DATABASE_POOL_MAX,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    trustProxy: env.TRUST_PROXY,
    maxBodyBytes: Math.floor(env.MAX_BODY_MB * 1024 * 1024),
    maxBodyMb: env.MAX_BODY_MB,
    cspMode: env.CSP_MODE,
    autoMigrate: env.AUTO_MIGRATE,
    logLevel: env.LOG_LEVEL,
    geminiApiKey: env.GEMINI_API_KEY,
  } as const;
}

export const config = load();
export type AppConfig = typeof config;
