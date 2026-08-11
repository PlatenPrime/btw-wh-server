import { describe, expect, it } from "vitest";
import { buildSharikArtImageUrl } from "../buildSharikArtImageUrl.js";

describe("buildSharikArtImageUrl", () => {
  it("строит prev URL по умолчанию", () => {
    expect(buildSharikArtImageUrl("1302-0065")).toBe(
      "https://sharik.ua/images/elements_big_prev/prev_1302-0065_m1.jpg"
    );
    expect(buildSharikArtImageUrl("1302-0065", "prev")).toBe(
      "https://sharik.ua/images/elements_big_prev/prev_1302-0065_m1.jpg"
    );
  });

  it("строит big URL", () => {
    expect(buildSharikArtImageUrl("1302-0065", "big")).toBe(
      "https://sharik.ua/images/elements_big/1302-0065_m1.jpg"
    );
  });

  it("encodeURIComponent для спецсимволов", () => {
    expect(buildSharikArtImageUrl("art with space", "big")).toBe(
      "https://sharik.ua/images/elements_big/art%20with%20space_m1.jpg"
    );
    expect(buildSharikArtImageUrl("a/b", "prev")).toBe(
      "https://sharik.ua/images/elements_big_prev/prev_a%2Fb_m1.jpg"
    );
  });
});
