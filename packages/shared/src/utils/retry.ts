// FILE: packages/shared/src/utils/retry.ts
export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (err: unknown, attempt: number) => void;
}

export class ProviderError extends Error {
  constructor(message: string, public provider: string, public cause?: unknown) {
    super(message);
    this.name = "ProviderError";
  }
}

function withTimeout<T>(p: Promise<T>, ms?: number): Promise<T> {
  if (!ms) return p;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseDelayMs = 500, maxDelayMs = 8000, timeoutMs, onRetry } = opts;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (err) {
      lastErr = err;
      attempt++;
      onRetry?.(err, attempt);
      if (attempt > retries) break;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)) * (0.75 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function withFallback<T>(
  providers: Array<{ name: string; run: () => Promise<T> }>,
  retryOpts: RetryOptions = {}
): Promise<{ result: T; providerUsed: string }> {
  if (providers.length === 0) {
    throw new ProviderError("No providers are configured", "none");
  }
  let lastErr: unknown;
  for (const p of providers) {
    try {
      const result = await withRetry(p.run, retryOpts);
      return { result, providerUsed: p.name };
    } catch (err) {
      lastErr = err;
    }
  }
  const providerNames = providers.map((provider) => provider.name).join(",");
  const reason = lastErr instanceof Error ? `: ${lastErr.message}` : "";
  throw new ProviderError(`All providers failed (${providerNames})${reason}`, providerNames, lastErr);
}