export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
}

export function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  return name === "TimeoutError" || name === "AbortError";
}

export function isAuthenticationError(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === 401 || status === 403) return true;
  return /API key|API_KEY|GEMINI_API_KEY|UNAUTHENTICATED/i.test(
    errorMessage(error),
  );
}

export function isRetryableTransportError(error: unknown): boolean {
  if (isAuthenticationError(error)) return false;
  if (isTimeoutError(error)) return true;

  const status = errorStatus(error);
  if (
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  ) {
    return true;
  }

  return /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|ECONNRESET|ETIMEDOUT|fetch failed|prepayment credits are depleted/i.test(
    errorMessage(error),
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: (attempt: number, signal: AbortSignal) => Promise<T>,
  options: {
    attempts: number;
    timeoutMs: number;
    baseDelayMs: number;
    shouldRetry: (error: unknown) => boolean;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const sleep = options.sleep ?? delay;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation(attempt, AbortSignal.timeout(options.timeoutMs));
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.shouldRetry(error)) {
        throw error;
      }
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
