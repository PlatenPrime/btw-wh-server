import { describe, expect, it } from "vitest";
import {
  EXCEL_JOB_KIND_IDS,
  isExcelJobKind,
  isExcelJobStatus,
} from "../excelJobConstants.js";

describe("excelJobConstants", () => {
  it("accepts registered kinds", () => {
    expect(isExcelJobKind("sku-konk-sales")).toBe(true);
    expect(isExcelJobKind("grabo-skus")).toBe(true);
    expect(EXCEL_JOB_KIND_IDS).toHaveLength(20);
  });

  it("rejects unknown kind and status", () => {
    expect(isExcelJobKind("nope")).toBe(false);
    expect(isExcelJobStatus("queued")).toBe(true);
    expect(isExcelJobStatus("done")).toBe(false);
  });
});
