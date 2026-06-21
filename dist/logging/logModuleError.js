import { createLogger } from "./createLogger.js";
export function logModuleError(module, err, message, extra) {
    createLogger({ module }).error({ err, ...extra }, message);
}
export function logModuleWarn(module, message, extra) {
    createLogger({ module }).warn(extra ?? {}, message);
}
export function logModuleInfo(module, message, extra) {
    createLogger({ module }).info(extra ?? {}, message);
}
export function logModuleDebug(module, message, extra) {
    createLogger({ module }).debug(extra ?? {}, message);
}
