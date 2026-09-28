import { describe, expect, it } from "vitest";
import {
  parseYuminProductsPage,
  yuminProductsPageSchema,
} from "../parseYuminProductsPage.js";

describe("parseYuminProductsPage", () => {
  it("parses JSON", () => {
    expect(parseYuminProductsPage('{"data":[]}', "https://x")).toEqual({
      data: [],
    });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseYuminProductsPage("not-json", "https://x/page")).toThrow(
      "Invalid JSON in Yumin listing response: https://x/page"
    );
  });
});

describe("yuminProductsPageSchema", () => {
  it("accepts valid listing payload", () => {
    const result = yuminProductsPageSchema.safeParse({
      data: [
        {
          id: 1,
          name: "Ball",
          url_key: "ball",
          base_image: { large_image_url: "https://cdn/a.jpg" },
        },
      ],
      links: { next: null },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid payload", () => {
    expect(yuminProductsPageSchema.safeParse({ data: "x" }).success).toBe(
      false
    );
  });
});
