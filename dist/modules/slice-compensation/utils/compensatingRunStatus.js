import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
const runningKonks = new Set();
/**
 * Пытается захватить in-memory lock на ручной compensating run для konk.
 * @returns true если lock захвачен; false если этот konk уже в работе
 */
export function tryAcquireCompensatingRun(konkName) {
    const key = normalizeCompetitorName(konkName);
    if (!key) {
        return false;
    }
    if (runningKonks.has(key)) {
        return false;
    }
    runningKonks.add(key);
    return true;
}
export function releaseCompensatingRun(konkName) {
    runningKonks.delete(normalizeCompetitorName(konkName));
}
export function isCompensatingRunActive(konkName) {
    return runningKonks.has(normalizeCompetitorName(konkName));
}
/** Только для тестов — сброс всех locks. */
export function clearCompensatingRunsForTests() {
    runningKonks.clear();
}
