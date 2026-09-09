import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { postPerfectAjax } from "../perfectAjaxPost.js";

describe("postPerfectAjax", () => {
  it("posts form body with ajax headers and merges Set-Cookie", async () => {
    const post = vi.fn().mockResolvedValue({
      status: 200,
      data: '{"ok":true}',
      headers: { "set-cookie": ["PrestaShop-cart=xyz; path=/"] },
    });
    const result = await postPerfectAjax(
      { post } as unknown as AxiosInstance,
      "https://perfectparty.in.ua/cart",
      "token=aa",
      "PHPSESSID=abc",
      "https://perfectparty.in.ua/x.html"
    );

    expect(result).toEqual({
      status: 200,
      data: '{"ok":true}',
      cookieHeader: "PHPSESSID=abc; PrestaShop-cart=xyz",
    });
    expect(post).toHaveBeenCalledWith(
      "https://perfectparty.in.ua/cart",
      "token=aa",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "PHPSESSID=abc",
          Referer: "https://perfectparty.in.ua/x.html",
          "X-Requested-With": "XMLHttpRequest",
        }),
      })
    );
  });

  it("omits Cookie when header is empty", async () => {
    const post = vi.fn().mockResolvedValue({ status: 204, data: "", headers: {} });
    await postPerfectAjax(
      { post } as unknown as AxiosInstance,
      "https://perfectparty.in.ua/cart",
      "a=1",
      "",
      "https://perfectparty.in.ua/x.html"
    );
    const headers = post.mock.calls[0]?.[2]?.headers ?? {};
    expect(headers.Cookie).toBeUndefined();
  });
});
