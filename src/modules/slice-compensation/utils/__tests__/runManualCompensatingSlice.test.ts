import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));

vi.mock("../runCompensatingSlicesForKonk.js", () => ({
  runCompensatingSlicesForKonk: vi.fn(),
}));

import {
  clearCompensatingRunsForTests,
  isCompensatingRunActive,
  tryAcquireCompensatingRun,
} from "../compensatingRunStatus.js";
import { runCompensatingSlicesForKonk } from "../runCompensatingSlicesForKonk.js";
import { runManualCompensatingSlice } from "../runManualCompensatingSlice.js";

describe("runManualCompensatingSlice", () => {
  beforeEach(() => {
    clearCompensatingRunsForTests();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearCompensatingRunsForTests();
  });

  it("warns and skips runner when lock already held", async () => {
    tryAcquireCompensatingRun("air");

    await runManualCompensatingSlice("air");

    expect(runCompensatingSlicesForKonk).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      { konkName: "air" },
      "compensating slice already running"
    );
    expect(isCompensatingRunActive("air")).toBe(true);
  });

  it("runs compensating slices and releases lock on success", async () => {
    vi.mocked(runCompensatingSlicesForKonk).mockResolvedValue({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 3, updated: 2 },
      sku: { refetched: 1, updated: 1 },
    });

    await runManualCompensatingSlice("air");

    expect(runCompensatingSlicesForKonk).toHaveBeenCalledWith("air");
    expect(mockLogger.info).toHaveBeenCalledWith(
      {
        konkName: "air",
        sliceDate: "2026-07-14",
        analog: { refetched: 3, updated: 2 },
        sku: { refetched: 1, updated: 1 },
      },
      "manual compensating slice done"
    );
    expect(isCompensatingRunActive("air")).toBe(false);
  });

  it("logs error and releases lock when runner throws", async () => {
    const err = new Error("scrape failed");
    vi.mocked(runCompensatingSlicesForKonk).mockRejectedValue(err);

    await runManualCompensatingSlice("air");

    expect(mockLogger.error).toHaveBeenCalledWith(
      { err, konkName: "air" },
      "manual compensating slice failed"
    );
    expect(isCompensatingRunActive("air")).toBe(false);
  });
});
