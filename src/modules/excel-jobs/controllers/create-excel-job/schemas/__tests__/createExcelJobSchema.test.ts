import { describe, expect, it } from "vitest";
import { createExcelJobSchema } from "../createExcelJobSchema.js";

describe("createExcelJobSchema", () => {
  it("defaults params to empty object", () => {
    const parsed = createExcelJobSchema.safeParse({ kind: "grabo-skus" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.params).toEqual({});
    }
  });

  it("rejects unknown kind", () => {
    const parsed = createExcelJobSchema.safeParse({ kind: "nope" });
    expect(parsed.success).toBe(false);
  });
});
