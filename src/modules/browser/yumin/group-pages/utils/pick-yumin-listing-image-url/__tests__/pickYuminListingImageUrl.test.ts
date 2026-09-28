import { describe, expect, it } from "vitest";
import { pickYuminListingImageUrl } from "../pickYuminListingImageUrl.js";

describe("pickYuminListingImageUrl", () => {
  it("prefers large then medium then original", () => {
    expect(
      pickYuminListingImageUrl({
        large_image_url: " L ",
        medium_image_url: "M",
        original_image_url: "O",
      })
    ).toBe("L");
    expect(
      pickYuminListingImageUrl({
        medium_image_url: "M",
        original_image_url: "O",
      })
    ).toBe("M");
    expect(pickYuminListingImageUrl({ original_image_url: "O" })).toBe("O");
  });

  it("returns null when missing", () => {
    expect(pickYuminListingImageUrl(null)).toBeNull();
    expect(pickYuminListingImageUrl(undefined)).toBeNull();
    expect(pickYuminListingImageUrl({})).toBeNull();
  });
});
