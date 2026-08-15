let running = false;

export function tryAcquireDeficitReport(): boolean {
  if (running) {
    return false;
  }
  running = true;
  return true;
}

export function releaseDeficitReport(): void {
  running = false;
}

export function isDeficitReportRunning(): boolean {
  return running;
}

/** Только для тестов. */
export function clearDeficitReportLockForTests(): void {
  running = false;
}
