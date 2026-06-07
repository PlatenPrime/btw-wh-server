import { describe, expect, it } from "vitest";
import { buildVariantSearchFilter } from "../buildVariantSearchFilter.js";

describe("buildVariantSearchFilter", () => {
  it("returns null for empty or whitespace search", () => {
    expect(buildVariantSearchFilter(undefined)).toBeNull();
    expect(buildVariantSearchFilter("")).toBeNull();
    expect(buildVariantSearchFilter("   ")).toBeNull();
  });

  it("builds case-insensitive regex on title", () => {
    const filter = buildVariantSearchFilter("Widget");
    expect(filter).toEqual({
      $or: [{ title: { $regex: "Widget", $options: "i" } }],
    });
  });

  it("escapes regex special characters", () => {
    const filter = buildVariantSearchFilter("a+b(c)");
    expect(filter?.$or[0]?.title?.$regex).toBe("a\\+b\\(c\\)");
  });
});
