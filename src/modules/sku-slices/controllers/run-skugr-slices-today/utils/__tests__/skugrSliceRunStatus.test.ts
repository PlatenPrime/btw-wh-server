import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSkugrSliceRunsForTests,
  isSkugrSliceRunActive,
  releaseSkugrSliceRun,
  tryAcquireSkugrSliceRun,
} from "../skugrSliceRunStatus.js";

describe("skugrSliceRunStatus", () => {
  beforeEach(() => {
    clearSkugrSliceRunsForTests();
  });

  it("acquires and releases lock", () => {
    expect(tryAcquireSkugrSliceRun("abc")).toBe(true);
    expect(isSkugrSliceRunActive("abc")).toBe(true);
    expect(tryAcquireSkugrSliceRun("abc")).toBe(false);
    releaseSkugrSliceRun("abc");
    expect(isSkugrSliceRunActive("abc")).toBe(false);
    expect(tryAcquireSkugrSliceRun("abc")).toBe(true);
  });

  it("rejects empty id", () => {
    expect(tryAcquireSkugrSliceRun("")).toBe(false);
    expect(tryAcquireSkugrSliceRun("   ")).toBe(false);
  });
});
