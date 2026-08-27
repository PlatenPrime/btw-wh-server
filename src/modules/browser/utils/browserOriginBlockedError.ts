export const ORIGIN_BLOCKED_CODE = "ORIGIN_BLOCKED";

/** Cloudflare origin-error range: 520 Web server is returning an unknown error … 526. */
export const CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MIN = 520;
export const CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MAX = 526;

export class BrowserOriginBlockedError extends Error {
  readonly code = ORIGIN_BLOCKED_CODE;
  readonly httpStatus: number;
  readonly retryAfterSec?: number;

  constructor(
    message: string,
    args: { httpStatus: number; retryAfterSec?: number; cause?: unknown }
  ) {
    super(
      message,
      args.cause !== undefined ? { cause: args.cause } : undefined
    );
    this.name = "BrowserOriginBlockedError";
    this.httpStatus = args.httpStatus;
    if (args.retryAfterSec !== undefined) {
      this.retryAfterSec = args.retryAfterSec;
    }
  }
}

export function isCloudflareOriginBlockedStatus(status: number): boolean {
  return (
    status >= CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MIN &&
    status <= CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MAX
  );
}

export function parseRetryAfterSeconds(
  value: string | undefined
): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return undefined;
  }
  return Number(trimmed);
}

export function isOriginBlockedError(
  err: unknown
): err is BrowserOriginBlockedError {
  if (err instanceof BrowserOriginBlockedError) {
    return true;
  }
  return Boolean(
    err &&
      typeof err === "object" &&
      (err as { code?: string }).code === ORIGIN_BLOCKED_CODE
  );
}
