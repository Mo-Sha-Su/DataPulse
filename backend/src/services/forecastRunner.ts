/**
 * Node-to-Python bridge for the `forecasting_engine` package.
 * Spawns `python3 -m forecasting_engine.cli`, streams JSON requests over stdin,
 * enforces concurrency and timeout limits, supports HTTP request cancellation,
 * and maps Python validation errors to structured 400 vs. 500 HttpErrors.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { HttpError } from '../lib/errors';
import { logger } from '../lib/logger';

export const FORECAST_LIMITS = {
  maxObservations: Number(process.env.FORECAST_MAX_OBSERVATIONS || 10000),
  maxHorizonDays: 365,
  maxHorizonStepsByFrequency: {
    daily: 365,
    weekly: 104,
    monthly: 36,
    quarterly: 12,
    yearly: 5,
  },
  maxConcurrentJobs: Number(process.env.FORECAST_MAX_CONCURRENT || 3),
  timeoutMs: Number(process.env.FORECAST_TIMEOUT_MS || 45000),
};

let activeJobs = 0;

function getModuleDir(): string | null {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
  } catch {
    // ESM module without __dirname
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // CJS bundle fallback
  }
  return null;
}

function resolveBackendRoot(): string {
  const modDir = getModuleDir();
  const candidates = [
    ...(modDir ? [path.resolve(modDir, '../..'), path.resolve(modDir, '..')] : []),
    path.resolve(process.cwd(), 'backend'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'forecasting_engine', 'cli.py'))) {
      return dir;
    }
  }
  return path.resolve(process.cwd(), 'backend');
}

function resolvePythonBin(backendRoot: string): string {
  if (process.env.FORECAST_PYTHON_BIN) return process.env.FORECAST_PYTHON_BIN;
  const venvPy = path.join(backendRoot, 'forecasting_engine', '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPy)) return venvPy;
  const venvWinPy = path.join(backendRoot, 'forecasting_engine', '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvWinPy)) return venvWinPy;
  return 'python3';
}

const MAX_STDOUT_BYTES = Number(process.env.FORECAST_MAX_STDOUT_BYTES || 20 * 1024 * 1024);
const MAX_STDERR_BYTES = Number(process.env.FORECAST_MAX_STDERR_BYTES || 256 * 1024);

/** Executes a single action (`detect_frequency`, `run_forecast`, `run_scenario`) in an isolated Python process. */
export async function runPythonEngine<T = any>(
  payload: Record<string, unknown>,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<T> {
  if (options?.signal?.aborted) {
    throw new HttpError(499, 'Forecast run cancelled by user.', 'FORECAST_CANCELLED');
  }

  if (activeJobs >= FORECAST_LIMITS.maxConcurrentJobs) {
    throw new HttpError(
      429,
      'Forecast engine is currently handling the maximum number of concurrent runs. Please wait a moment and retry.',
      'FORECAST_CONCURRENCY_LIMIT',
      { maxConcurrentJobs: FORECAST_LIMITS.maxConcurrentJobs },
    );
  }

  const backendRoot = resolveBackendRoot();
  const pythonBin = resolvePythonBin(backendRoot);
  const timeoutMs = options?.timeoutMs ?? FORECAST_LIMITS.timeoutMs;

  activeJobs += 1;
  try {
    return await new Promise<T>((resolve, reject) => {
      let settled = false;
      let childExited = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let killTimer: ReturnType<typeof setTimeout> | null = null;

      const child = spawn(pythonBin, ['-m', 'forecasting_engine.cli'], {
        cwd: backendRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          OPENBLAS_NUM_THREADS: '1',
          OMP_NUM_THREADS: '1',
          MKL_NUM_THREADS: '1',
        },
      });

      const stdoutChunks: Buffer[] = [];
      let stdoutBytes = 0;
      const stderrChunks: Buffer[] = [];
      let stderrBytes = 0;

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (killTimer) {
          clearTimeout(killTimer);
          killTimer = null;
        }
        options?.signal?.removeEventListener('abort', onAbort);
      };

      const killChild = () => {
        if (childExited) return;
        try {
          child.kill('SIGTERM');
        } catch {
          // Process may have already exited
        }
        if (!killTimer) {
          killTimer = setTimeout(() => {
            killTimer = null;
            if (!childExited) {
              try {
                child.kill('SIGKILL');
              } catch {
                // Ignore if already dead
              }
            }
          }, 500);
          killTimer.unref();
        }
      };

      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        killChild();
        reject(new HttpError(499, 'Forecast run cancelled by user.', 'FORECAST_CANCELLED'));
      };

      child.once('exit', () => {
        childExited = true;
        if (killTimer) {
          clearTimeout(killTimer);
          killTimer = null;
        }
      });

      if (options?.signal?.aborted) {
        onAbort();
        return;
      }
      options?.signal?.addEventListener('abort', onAbort, { once: true });

      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        killChild();
        reject(
          new HttpError(
            504,
            `Forecast execution exceeded the ${Math.round(timeoutMs / 1000)}s timeout limit. Try a coarser frequency or fewer observations.`,
            'FORECAST_TIMEOUT',
          ),
        );
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer | string) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8');
        stdoutBytes += buf.length;
        if (stdoutBytes > MAX_STDOUT_BYTES) {
          if (!settled) {
            settled = true;
            cleanup();
            killChild();
            logger.error('Python forecasting engine exceeded stdout size cap', { stdoutBytes, MAX_STDOUT_BYTES });
            reject(
              new HttpError(
                500,
                'Forecast output exceeded the maximum response size limit.',
                'ENGINE_OUTPUT_TOO_LARGE',
              ),
            );
          }
          return;
        }
        stdoutChunks.push(buf);
      });

      child.stderr.on('data', (chunk: Buffer | string) => {
        if (stderrBytes >= MAX_STDERR_BYTES) return;
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8');
        const remaining = MAX_STDERR_BYTES - stderrBytes;
        const slice = buf.length > remaining ? buf.subarray(0, remaining) : buf;
        stderrChunks.push(slice);
        stderrBytes += slice.length;
      });

      child.stdin.on('error', () => {
        // Ignore EPIPE when child terminates before stdin flush completes; close/error handler reports it.
      });

      child.on('error', (err) => {
        childExited = true;
        if (settled) return;
        settled = true;
        cleanup();
        logger.error('Failed to spawn Python forecasting engine', { err: err.message });
        reject(new HttpError(500, 'Forecasting service is temporarily unavailable.', 'ENGINE_SPAWN_ERROR'));
      });

      child.on('close', (code) => {
        childExited = true;
        if (settled) return;
        settled = true;
        cleanup();

        const stdout = Buffer.concat(stdoutChunks).toString('utf8');
        const stderr = Buffer.concat(stderrChunks).toString('utf8');
        const trimmed = stdout.trim();
        if (!trimmed) {
          const stderrTrimmed = stderr.trim();
          const missingDepMatch = stderrTrimmed.match(/ModuleNotFoundError:\s+No module named\s+['"]?([a-zA-Z0-9_.-]+)['"]?/);
          if (missingDepMatch) {
            logger.error('Python forecasting engine missing dependency', { code, module: missingDepMatch[1] });
            reject(
              new HttpError(
                500,
                'Forecasting engine runtime dependencies are missing on the server.',
                'ENGINE_DEPENDENCY_MISSING',
              ),
            );
            return;
          }
          logger.error('Python forecasting engine exited without output', { code, stderr: stderrTrimmed.slice(0, 1000) });
          reject(
            new HttpError(
              500,
              'Forecasting engine encountered an internal execution error.',
              'ENGINE_EMPTY_OUTPUT',
            ),
          );
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          logger.error('Python forecasting engine returned invalid JSON', { code, stderr: stderr.trim().slice(0, 500) });
          reject(
            new HttpError(
              500,
              'Forecasting engine returned an unexpected response.',
              'ENGINE_INVALID_OUTPUT',
            ),
          );
          return;
        }

        if (!parsed.ok) {
          const errCode = parsed.error?.code || 'FORECAST_FAILED';
          const errMsg = parsed.error?.message || 'Forecast execution failed.';
          const errDetails = parsed.error?.details;
          const isInputErr = new Set([
            'INSUFFICIENT_HISTORY',
            'NEEDS_FREQUENCY_OVERRIDE',
            'INVALID_FREQUENCY',
            'INVALID_HORIZON',
            'INCOMPATIBLE_HORIZON',
            'INVALID_MODEL',
            'INCOMPATIBLE_MODEL',
            'INSUFFICIENT_SEASONAL_HISTORY',
            'TOO_MANY_MISSING_PERIODS',
            'SCENARIO_DRIVER_NOT_APPLICABLE',
            'INVALID_INPUT',
            'EMPTY_INPUT',
          ]).has(errCode);
          if (!isInputErr) {
            logger.error('Python forecasting engine reported internal error', { errCode, errMsg });
          }
          reject(
            new HttpError(
              isInputErr ? 400 : 500,
              isInputErr ? errMsg : 'Forecast execution failed due to a modeling error.',
              errCode,
              isInputErr ? errDetails : undefined,
            ),
          );
          return;
        }

        resolve(parsed.data as T);
      });

      child.stdin.write(JSON.stringify({ maxObservations: FORECAST_LIMITS.maxObservations, ...payload }));
      child.stdin.end();
    });
  } finally {
    activeJobs = Math.max(0, activeJobs - 1);
  }
}

export function getActiveForecastJobs(): number {
  return activeJobs;
}
