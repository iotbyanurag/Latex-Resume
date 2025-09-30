export class ProviderError extends Error {
    cause;
    status;
    constructor(message, cause, status) {
        super(message);
        this.cause = cause;
        this.status = status;
        this.name = 'ProviderError';
    }
}
export async function withRetry(task, attempts = 3, baseDelayMs = 500) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await task();
        }
        catch (error) {
            lastError = error;
            if (attempt === attempts)
                break;
            const backoff = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }
    }
    throw lastError;
}
export function createAbortSignal(timeoutMs = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (typeof timer.unref === 'function') {
        timer.unref?.();
    }
    return controller.signal;
}
export function redactKey(key) {
    if (!key)
        return 'missing';
    if (key.length <= 8)
        return '****';
    return `${key.slice(0, 4)}...${key.slice(-2)}`;
}
