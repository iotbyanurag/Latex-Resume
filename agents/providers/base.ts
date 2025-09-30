export interface Prompt {
  system: string;
  user: string;
}

export interface CompletionOptions {
  model: string;
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
}

export interface ProviderResult {
  id: string;
  model: string;
  content: string;
  usage?: Record<string, number>;
}

export type ProviderFn = (prompt: Prompt, opts: CompletionOptions) => Promise<ProviderResult>;

export class ProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown, public readonly status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

export async function withRetry<T>(task: () => Promise<T>, attempts = 3, baseDelayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const backoff = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

export function createAbortSignal(timeoutMs = 60000): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref?: () => void }).unref?.();
  }
  return controller.signal;
}

export function redactKey(key?: string | null): string {
  if (!key) return 'missing';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-2)}`;
}
