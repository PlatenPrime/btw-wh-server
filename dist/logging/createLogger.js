import { rootLogger } from "./logger.js";
export function createLogger(bindings) {
    return rootLogger.child(bindings);
}
