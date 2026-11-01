import { describe, expect, it } from "vitest";
import {
  DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY,
  shouldReportRescaleProgress,
} from "../shouldReportRescaleProgress.js";

describe("shouldReportRescaleProgress", () => {
  it("reports first, every 10th, and last", () => {
    expect(shouldReportRescaleProgress(1, 25)).toBe(true);
    expect(shouldReportRescaleProgress(2, 25)).toBe(false);
    expect(shouldReportRescaleProgress(10, 25)).toBe(true);
    expect(shouldReportRescaleProgress(20, 25)).toBe(true);
    expect(shouldReportRescaleProgress(25, 25)).toBe(true);
  });

  it("uses custom every", () => {
    expect(shouldReportRescaleProgress(5, 12, 5)).toBe(true);
    expect(shouldReportRescaleProgress(6, 12, 5)).toBe(false);
  });

  it("rejects invalid bounds", () => {
    expect(shouldReportRescaleProgress(0, 10)).toBe(false);
    expect(shouldReportRescaleProgress(1, 0)).toBe(false);
    expect(shouldReportRescaleProgress(1, 10, 0)).toBe(false);
  });

  it("exports default every=10", () => {
    expect(DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY).toBe(10);
  });
});
