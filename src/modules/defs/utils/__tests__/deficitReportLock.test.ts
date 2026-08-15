import { afterEach, describe, expect, it } from "vitest";
import {
  clearDeficitReportLockForTests,
  isDeficitReportRunning,
  releaseDeficitReport,
  tryAcquireDeficitReport,
} from "../deficitReportLock.js";

describe("deficitReportLock", () => {
  afterEach(() => {
    clearDeficitReportLockForTests();
  });

  it("acquires once and rejects the second caller", () => {
    expect(tryAcquireDeficitReport()).toBe(true);
    expect(isDeficitReportRunning()).toBe(true);
    expect(tryAcquireDeficitReport()).toBe(false);
  });

  it("allows acquire after release", () => {
    expect(tryAcquireDeficitReport()).toBe(true);
    releaseDeficitReport();
    expect(isDeficitReportRunning()).toBe(false);
    expect(tryAcquireDeficitReport()).toBe(true);
  });

  it("clearDeficitReportLockForTests resets the lock", () => {
    expect(tryAcquireDeficitReport()).toBe(true);
    clearDeficitReportLockForTests();
    expect(isDeficitReportRunning()).toBe(false);
    expect(tryAcquireDeficitReport()).toBe(true);
  });
});
