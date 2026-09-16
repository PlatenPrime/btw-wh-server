import path from "node:path";
import { describe, expect, it } from "vitest";
import { getExcelJobFilePath, getExcelJobsDir } from "../excelJobFilePaths.js";

describe("excelJobFilePaths", () => {
  it("builds xlsx path under jobs dir", () => {
    expect(path.basename(getExcelJobFilePath("abc"))).toBe("abc.xlsx");
    expect(getExcelJobFilePath("abc").startsWith(getExcelJobsDir())).toBe(true);
  });
});
