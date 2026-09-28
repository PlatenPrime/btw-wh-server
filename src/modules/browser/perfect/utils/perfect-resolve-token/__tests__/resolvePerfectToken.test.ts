import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import {
  PERFECT_CART_SHOW_URL,
  resolvePerfectToken,
} from "../resolvePerfectToken.js";

vi.mock("../../perfect-product-page-extract/perfectProductPageExtract.js", () => ({
  extractToken: vi.fn((html: string) => {
    if (html.includes("token-from-html")) return "html-token";
    if (html.includes("token-from-cart")) return "cart-token";
    return null;
  }),
}));

describe("resolvePerfectToken", () => {
  it("returns token from product HTML without cart GET", async () => {
    const get = vi.fn();
    const client = { get } as unknown as AxiosInstance;
    const result = await resolvePerfectToken(
      client,
      "token-from-html",
      "a=1"
    );
    expect(result).toEqual({ token: "html-token", cookieHeader: "a=1" });
    expect(get).not.toHaveBeenCalled();
  });

  it("falls back to cart?action=show and merges cookies", async () => {
    const get = vi.fn().mockResolvedValue({
      data: "token-from-cart",
      headers: { "set-cookie": ["b=2; Path=/"] },
    });
    const client = { get } as unknown as AxiosInstance;
    const result = await resolvePerfectToken(client, "no-token", "a=1");
    expect(result.token).toBe("cart-token");
    expect(result.cookieHeader).toContain("a=1");
    expect(result.cookieHeader).toContain("b=2");
    expect(get).toHaveBeenCalledWith(
      PERFECT_CART_SHOW_URL,
      expect.objectContaining({
        headers: { Cookie: "a=1" },
      })
    );
  });
});
