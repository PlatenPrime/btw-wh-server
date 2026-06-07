import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sleep } from "../sleep.js";

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after specified milliseconds", async () => {
    const promise = sleep(500);
    vi.advanceTimersByTime(499);
    await Promise.resolve();
    let settled = false;
    promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    vi.advanceTimersByTime(1);
    await promise;
    expect(settled).toBe(true);
  });
});
