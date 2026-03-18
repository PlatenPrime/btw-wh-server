import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../../../models/Variant.js";
import { getVariantByIdUtil } from "../getVariantByIdUtil.js";

describe("getVariantByIdUtil", () => {
  beforeEach(async () => {
    await Variant.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getVariantByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns variant when exists", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Variant",
      url: "https://x.com/variant",
      imageUrl: "https://example.com/v.png",
    });

    const result = await getVariantByIdUtil(variant._id.toString());
    expect(result).toBeTruthy();
    expect(result?.title).toBe("Variant");
  });
});

