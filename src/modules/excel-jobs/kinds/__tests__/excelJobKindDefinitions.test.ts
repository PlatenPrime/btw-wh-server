import { describe, expect, it } from "vitest";
import { RoleType } from "../../../../constants/roles.js";
import { EXCEL_JOB_KIND_IDS } from "../../constants/excelJobConstants.js";
import { getExcelJobKindDefinition } from "../excelJobKindDefinitions.js";

describe("excelJobKindDefinitions", () => {
  it("defines every kind with ADMIN role and schema", () => {
    for (const kind of EXCEL_JOB_KIND_IDS) {
      const def = getExcelJobKindDefinition(kind);
      expect(def?.kind).toBe(kind);
      expect(def?.minRole).toBe(RoleType.ADMIN);
      expect(def?.schema).toBeDefined();
      expect(def?.oldPath.length).toBeGreaterThan(0);
    }
  });

  it("returns undefined for unknown kind", () => {
    expect(getExcelJobKindDefinition("nope")).toBeUndefined();
  });

  it("parses sku-konk-sales params", () => {
    const def = getExcelJobKindDefinition("sku-konk-sales");
    const parsed = def!.schema.safeParse({
      konk: "air",
      prod: "gemar",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid sku-konk-sales params", () => {
    const def = getExcelJobKindDefinition("sku-konk-sales");
    const parsed = def!.schema.safeParse({ konk: "air" });
    expect(parsed.success).toBe(false);
  });
});
