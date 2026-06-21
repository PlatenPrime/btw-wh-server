export function registerProcessHandlers(log) {
    process.on("uncaughtException", (err) => {
        log.fatal({ err }, "uncaught exception");
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        log.error({ err: reason }, "unhandled rejection");
    });
}
