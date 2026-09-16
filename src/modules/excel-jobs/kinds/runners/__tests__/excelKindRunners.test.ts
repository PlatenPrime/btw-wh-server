import { describe, expect, it } from "vitest";
import { runAnalogComparison } from "../runAnalogExcelKinds.js";
import { runArtsExport, runGraboSkus } from "../runWarehouseExcelKinds.js";

describe("excel kind runners", () => {
  it("analog comparison fails validation", async () => {
    const result = await runAnalogComparison({});
    expect(result.ok).toBe(false);
  });

  it("grabo builds a buffer", async () => {
    const result = await runGraboSkus({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.fileName).toMatch(/\.xlsx$/);
    }
  });

  it("arts export fails when catalog is empty", async () => {
    const result = await runArtsExport({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("No arts found to export");
    }
  });
});
