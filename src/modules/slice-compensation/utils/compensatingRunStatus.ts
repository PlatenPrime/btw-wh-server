import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";

const runningKonks = new Set<string>();

/**
 * Пытается захватить in-memory lock на ручной compensating run для konk.
 * @returns true если lock захвачен; false если этот konk уже в работе
 */
export function tryAcquireCompensatingRun(konkName: string): boolean {
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

export function releaseCompensatingRun(konkName: string): void {
  runningKonks.delete(normalizeCompetitorName(konkName));
}

export function isCompensatingRunActive(konkName: string): boolean {
  return runningKonks.has(normalizeCompetitorName(konkName));
}

/** Только для тестов — сброс всех locks. */
export function clearCompensatingRunsForTests(): void {
  runningKonks.clear();
}
