import { describe, expect, it } from "vitest";
import {
  notifyExcelBuildProgress,
} from "../excelBuildProgress.js";

describe("notifyExcelBuildProgress", () => {
  it("does nothing without handler", () => {
    expect(() => notifyExcelBuildProgress(undefined, 1, 2)).not.toThrow();
  });

  it("clamps done to total and uses 1 when total is 0", () => {
    const calls: Array<[number, number]> = [];
    notifyExcelBuildProgress((done, total) => calls.push([done, total]), 5, 3);
    notifyExcelBuildProgress((done, total) => calls.push([done, total]), 1, 0);
    expect(calls).toEqual([
      [3, 3],
      [1, 1],
    ]);
  });
});
