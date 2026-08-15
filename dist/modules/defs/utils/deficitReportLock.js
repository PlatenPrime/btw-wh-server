let running = false;
export function tryAcquireDeficitReport() {
    if (running) {
        return false;
    }
    running = true;
    return true;
}
export function releaseDeficitReport() {
    running = false;
}
export function isDeficitReportRunning() {
    return running;
}
/** Только для тестов. */
export function clearDeficitReportLockForTests() {
    running = false;
}
