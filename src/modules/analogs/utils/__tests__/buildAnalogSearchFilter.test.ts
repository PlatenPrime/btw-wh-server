import { describe, expect, it } from "vitest";
import { buildAnalogSearchFilter } from "../buildAnalogSearchFilter.js";

describe("buildAnalogSearchFilter", () => {
  it("returns null for empty or whitespace search", () => {
    expect(buildAnalogSearchFilter(undefined)).toBeNull();
    expect(buildAnalogSearchFilter("")).toBeNull();
    expect(buildAnalogSearchFilter("   ")).toBeNull();
  });

  it("builds case-insensitive regex on nameukr", () => {
    const filter = buildAnalogSearchFilter("Widget");
    expect(filter).toEqual({
      $or: [{ nameukr: { $regex: "Widget", $options: "i" } }],
    });
  });

  it("escapes regex special characters", () => {
    const filter = buildAnalogSearchFilter("a+b(c)");
    expect(filter?.$or[0]?.nameukr?.$regex).toBe("a\\+b\\(c\\)");
  });
});
