import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../../../models/Variant.js";
import { deleteVariantByIdUtil } from "../deleteVariantByIdUtil.js";

describe("deleteVariantByIdUtil", () => {
  beforeEach(async () => {
    await Variant.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await deleteVariantByIdUtil(
      "000000000000000000000000"
    );
    expect(result).toBeNull();
  });

  it("deletes variant and returns deleted document", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Variant",
      url: "https://x.com",
      imageUrl: "https://example.com/img.png",
    });

    const result = await deleteVariantByIdUtil(variant._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(variant._id.toString());

    const found = await Variant.findById(variant._id);
    expect(found).toBeNull();
  });
});

