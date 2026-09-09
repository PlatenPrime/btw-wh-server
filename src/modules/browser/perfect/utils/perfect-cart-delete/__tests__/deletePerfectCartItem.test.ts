import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { deletePerfectCartItem } from "../deletePerfectCartItem.js";
import { logBrowserError } from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js", () => ({
  logBrowserError: vi.fn(),
}));

describe("deletePerfectCartItem", () => {
  it("POSTs delete=1 to cart", async () => {
    const post = vi.fn().mockResolvedValue({ status: 200, data: "{}", headers: {} });
    await deletePerfectCartItem({ post } as unknown as AxiosInstance, {
      token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      idProduct: "12115",
      idProductAttribute: "3651",
      idCustomization: "0",
      cookieHeader: "PHPSESSID=abc",
      productUrl: "https://perfectparty.in.ua/x.html",
    });

    const body = new URLSearchParams(String(post.mock.calls[0]?.[1] ?? ""));
    expect(post.mock.calls[0]?.[0]).toBe("https://perfectparty.in.ua/cart");
    expect(body.get("delete")).toBe("1");
    expect(body.get("id_product")).toBe("12115");
  });

  it("swallows post errors after logging", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));
    await expect(
      deletePerfectCartItem({ post } as unknown as AxiosInstance, {
        token: "aa",
        idProduct: "1",
        idProductAttribute: null,
        idCustomization: "0",
        cookieHeader: "",
        productUrl: "https://perfectparty.in.ua/x.html",
      })
    ).resolves.toBeUndefined();
    expect(logBrowserError).toHaveBeenCalled();
  });
});
