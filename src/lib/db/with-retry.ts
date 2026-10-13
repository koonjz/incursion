/**
 * Neon Cold-Start & Connection Transient Error Retry Helper
 *
 * Automatically retries transient database queries when Neon compute nodes
 * are waking from autosuspend (P1001, P1002, P1017, connection timeouts).
 */

export interface RetryOptions {
  /** Maximum number of attempts before throwing (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 500) */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffFactor?: number;
  /** Maximum delay cap in milliseconds (default: 4000) */
  maxDelayMs?: number;
  /** Optional logger function */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const TRANSIENT_PRISMA_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);

const TRANSIENT_MESSAGE_PATTERNS = [
  /can't reach database/i,
  /timed out/i,
  /connection closed/i,
  /connection refused/i,
  /etimedout/i,
  /econnreset/i,
  /econnrefused/i,
];

/**
 * Determines whether a thrown error is a recognized transient Neon connection error.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const errObj = error as Record<string, unknown>;

  // Check Prisma error code property
  if (typeof errObj.code === "string" && TRANSIENT_PRISMA_ERROR_CODES.has(errObj.code)) {
    return true;
  }

  // Check error message string patterns
  if (typeof errObj.message === "string") {
    return TRANSIENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(errObj.message as string));
  }

  return false;
}

/**
 * Executes an asynchronous database operation with exponential backoff retry.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 500;
  const backoffFactor = options.backoffFactor ?? 2;
  const maxDelayMs = options.maxDelayMs ?? 4000;

  let attempt = 0;
  let currentDelay = initialDelayMs;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await operation();
    } catch (err: unknown) {
      const isTransient = isTransientDbError(err);

      if (!isTransient || attempt >= maxAttempts) {
        throw err;
      }

      if (options.onRetry && err instanceof Error) {
        options.onRetry(err, attempt, currentDelay);
      }

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffFactor, maxDelayMs);
    }
  }

  throw new Error("Retry attempts exhausted without result");
}
