let running = false;
export function tryAcquireGraboSkuSync() {
    if (running) {
        return false;
    }
    running = true;
    return true;
}
export function releaseGraboSkuSync() {
    running = false;
}
export function isGraboSkuSyncRunning() {
    return running;
}
/** Только для тестов. */
export function clearGraboSkuSyncForTests() {
    running = false;
}
