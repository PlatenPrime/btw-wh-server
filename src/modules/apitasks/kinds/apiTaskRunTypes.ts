import type { ApiTaskKind } from "../constants/apiTaskConstants.js";

export type ApiTaskProgressHandler = (
  done: number,
  total: number,
  message?: string,
) => void;

export type ApiTaskRunResult =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; error: string };

export type ApiTaskRunOptions = {
  onProgress?: ApiTaskProgressHandler;
  signal?: AbortSignal;
  userId?: string;
};

export type ApiTaskKindRunner = (
  params: unknown,
  options?: ApiTaskRunOptions,
) => Promise<ApiTaskRunResult>;

export function failApiTaskRun(error: string): ApiTaskRunResult {
  return { ok: false, error };
}

export function okApiTaskRun(
  result: Record<string, unknown>,
): ApiTaskRunResult {
  return { ok: true, result };
}

export function assertKind(_kind: ApiTaskKind): void {
  // marker for exhaustive switches in tests
}

export class ApiTaskAbortedError extends Error {
  constructor(message = "Api task aborted") {
    super(message);
    this.name = "ApiTaskAbortedError";
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new ApiTaskAbortedError();
  }
}

export function isApiTaskAbortedError(error: unknown): boolean {
  return (
    error instanceof ApiTaskAbortedError ||
    (error instanceof Error && error.name === "AbortError")
  );
}
