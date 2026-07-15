import { closePlaywrightBrowser } from "../modules/browser/utils/playwrightBrowser.js";
let shutdownInProgress = false;
async function shutdown(log, signal) {
    if (shutdownInProgress) {
        return;
    }
    shutdownInProgress = true;
    log.info({ signal }, "shutdown signal received");
    try {
        await closePlaywrightBrowser();
    }
    catch (err) {
        log.warn({ err }, "error while closing Playwright browser on shutdown");
    }
    process.exit(0);
}
export function registerProcessHandlers(log) {
    process.on("uncaughtException", (err) => {
        log.fatal({ err }, "uncaught exception");
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        log.error({ err: reason }, "unhandled rejection");
    });
    const onSignal = (signal) => {
        void shutdown(log, signal);
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
}
/** Сброс флага shutdown в тестах. */
export function resetShutdownStateForTests() {
    shutdownInProgress = false;
}
