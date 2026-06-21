import { createLogger } from "./createLogger.js";

export function logModuleError(
  module: string,
  err: unknown,
  message: string,
  extra?: Record<string, unknown>
): void {
  createLogger({ module }).error({ err, ...extra }, message);
}

export function logModuleWarn(
  module: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  createLogger({ module }).warn(extra ?? {}, message);
}

export function logModuleInfo(
  module: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  createLogger({ module }).info(extra ?? {}, message);
}

export function logModuleDebug(
  module: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  createLogger({ module }).debug(extra ?? {}, message);
}
