import { describe, expect, it } from "vitest";
import { toCanonicalSkuProductId } from "../toCanonicalSkuProductId.js";

describe("toCanonicalSkuProductId", () => {
  it("lowercases konk and trims", () => {
    expect(toCanonicalSkuProductId("  Air  ", " 123 ")).toBe("air-123");
  });
});
