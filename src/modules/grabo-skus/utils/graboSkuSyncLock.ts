let running = false;

export function tryAcquireGraboSkuSync(): boolean {
  if (running) {
    return false;
  }
  running = true;
  return true;
}

export function releaseGraboSkuSync(): void {
  running = false;
}

export function isGraboSkuSyncRunning(): boolean {
  return running;
}

/** Только для тестов. */
export function clearGraboSkuSyncForTests(): void {
  running = false;
}
