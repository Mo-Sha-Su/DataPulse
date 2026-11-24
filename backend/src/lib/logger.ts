import { config } from '../config';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 } as const;
type Level = keyof typeof LEVELS;

function emit(level: Exclude<Level, 'silent'>, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[config.logLevel]) return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta });
  (level === 'error' ? process.stderr : process.stdout).write(line + '\n');
}

export function errorMeta(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { err: err.message, stack: config.isProd ? undefined : err.stack, code: (err as any).code };
  }
  return { err: String(err) };
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
};
