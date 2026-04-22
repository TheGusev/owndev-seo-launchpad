import { logger } from './logger.js';

export interface RetryOptions {
  retries?: number;          // default 3
  baseDelayMs?: number;      // default 1000
  retryOnStatus?: number[];  // default [429, 500, 502, 503, 504]
  label?: string;            // for logs
}

/** Выполняет fn с экспоненциальным backoff. fn должен бросать ошибку с .status для HTTP-кодов. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 1000;
  const codes = opts.retryOnStatus ?? [429, 500, 502, 503, 504];
  const label = opts.label ?? 'RETRY';
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status: number | undefined = err?.status;
      const retryable = status !== undefined && codes.includes(status);
      const isLast = i === retries - 1;
      if (!retryable || isLast) throw err;
      const delay = base * Math.pow(2, i); // 1s, 2s, 4s
      logger.warn(label, `attempt ${i + 1}/${retries} failed (status=${status}), retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('Max retries exceeded');
}

/** Ошибка с HTTP-статусом — чтобы withRetry мог решать ретраить или нет. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}