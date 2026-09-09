import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerfectStockData } from "../getPerfectStockData.js";
import { getBrowserAxios } from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js", () => ({
  getBrowserAxios: vi.fn(),
  logBrowserError: vi.fn(),
}));

const CART_URL = "https://perfectparty.in.ua/cart";

function inStockPageHtml(extra = ""): string {
  return `
    <html><head>
      <meta property="og:title" content="Кулька 10 шт. в уп.">
      <meta property="product:availability" content="in_stock" />
    </head><body>
      <script>var prestashop = {"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"};</script>
      ${extra}
    </body></html>
  `;
}

describe("getPerfectStockData", () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();

  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    vi.mocked(getBrowserAxios).mockReturnValue({
      get: mockGet,
      post: mockPost,
    } as unknown as ReturnType<typeof getBrowserAxios>);
  });

  function mockRefreshMissThenCart(
    cart: { status?: number; data: unknown; headers?: Record<string, unknown> },
    deleteResp: { data?: unknown } = {}
  ): void {
    mockPost
      .mockResolvedValueOnce({ status: 200, data: "{}" })
      .mockResolvedValueOnce({
        status: cart.status ?? 200,
        data: typeof cart.data === "string" ? cart.data : JSON.stringify(cart.data),
        headers: cart.headers,
      })
      .mockResolvedValueOnce({ status: 200, data: deleteResp.data ?? "{}" });
  }

  function expectRefreshThenCartDelete(productUrl: string): void {
    expect(mockPost.mock.calls[0]?.[0]).toBe(productUrl);
    const refresh = new URLSearchParams(String(mockPost.mock.calls[0]?.[1] ?? ""));
    expect(refresh.get("action")).toBe("refresh");
    expect(refresh.get("ajax")).toBe("1");

    const cartCalls = mockPost.mock.calls.filter((call) => call[0] === CART_URL);
    expect(cartCalls).toHaveLength(2);
    expect(new URLSearchParams(String(cartCalls[0]?.[1] ?? "")).get("add")).toBe("1");
    expect(new URLSearchParams(String(cartCalls[1]?.[1] ?? "")).get("delete")).toBe("1");
  }

  it("returns stock and price per piece when title has pack count", async () => {
    const productUrl =
      "https://perfectparty.in.ua/bez-malyunku-po-10-sht20-sht/16467-product.html";
    mockGet.mockResolvedValueOnce({
      data: inStockPageHtml(),
      headers: {
        "set-cookie": ["PHPSESSID=abc; path=/", "PrestaShop-foo=bar; path=/"],
      },
    });
    mockRefreshMissThenCart({
      data: {
        success: true,
        cart: {
          products: [
            {
              stock_quantity: 9,
              price_without_reduction: 45,
              name: "Кулька 10 шт. в уп.",
            },
          ],
        },
      },
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 90,
      price: 4.5,
      title: "Кулька 10 шт. в уп.",
      source: "cart",
    });
    expectRefreshThenCartDelete(productUrl);
    expect(mockPost).toHaveBeenCalledWith(
      CART_URL,
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: expect.stringContaining("PHPSESSID=abc"),
        }),
      })
    );
  });

  it("uses pack count from product HTML when title has no N шт", async () => {
    const productUrl = "https://perfectparty.in.ua/test/16467-product.html";
    mockGet.mockResolvedValueOnce({
      data: `
        <html><head>
          <meta property="og:title" content="Кулька Gemar пастель">
        </head><body>
          <p>Штук в упаковці: 100</p>
          <script>var prestashop = {"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"};</script>
        </body></html>
      `,
      headers: {},
    });
    mockRefreshMissThenCart({
      data: {
        success: true,
        cart: {
          products: [
            {
              stock_quantity: 1,
              price_without_reduction: 275,
              name: 'Кулька Gemar 12"/57 КП Пастель яскраво-рожевий',
            },
          ],
        },
      },
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 100,
      price: 2.75,
      title: 'Кулька Gemar 12"/57 КП Пастель яскраво-рожевий',
      source: "cart",
    });
    expectRefreshThenCartDelete(productUrl);
  });

  it("returns stock and price as is when pack count is absent", async () => {
    const productUrl = "https://perfectparty.in.ua/test/16467-product.html";
    mockGet.mockResolvedValueOnce({
      data: `
        <html><head>
          <meta property="og:title" content="Кулька без фасовки">
        </head><body>
          <script>window.data={"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"};</script>
        </body></html>
      `,
      headers: {},
    });
    mockRefreshMissThenCart({
      data: {
        success: true,
        cart: {
          products: [
            {
              stock_quantity: 9,
              price_without_reduction: "45,00 грн.",
              name: "Кулька без фасовки",
            },
          ],
        },
      },
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 9,
      price: 45,
      title: "Кулька без фасовки",
      source: "cart",
    });
  });

  it("uses embedded price fallback when direct price is absent", async () => {
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockRefreshMissThenCart({
      data: {
        success: true,
        cart: {
          products: [
            {
              stock_quantity: 3,
              embedded_attributes: {
                price_without_reduction: "99,90 грн.",
                name: "Товар",
              },
            },
          ],
        },
      },
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/path/16467-item.html"
    );
    expect(result.stock).toBe(3);
    expect(result.price).toBe(99.9);
    expect(result.source).toBe("cart");
  });

  it("uses cart?action=show fallback when token is missing in product page", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet
      .mockResolvedValueOnce({
        data: `<html><body>{"id_product":"16467"}</body></html>`,
        headers: { "set-cookie": ["PHPSESSID=abc; path=/"] },
      })
      .mockResolvedValueOnce({
        data: `<a href="/cart?update=1&id_product=16467&token=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb">u</a>`,
        headers: { "set-cookie": ["PrestaShop-foo=bar; path=/"] },
      });
    mockRefreshMissThenCart({
      data: {
        cart: {
          products: [{ stock_quantity: 5, price_without_reduction: 50, name: "Товар" }],
        },
      },
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 5,
      price: 50,
      title: "Товар",
      source: "cart",
    });
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      "https://perfectparty.in.ua/cart?action=show",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: expect.stringContaining("PHPSESSID=abc"),
        }),
      })
    );
    expectRefreshThenCartDelete(productUrl);
  });

  it("returns negative outcome when token is missing in both product page and cart page", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: `<html><body>{"id_product":"16467"}</body></html>`,
        headers: {},
      })
      .mockResolvedValueOnce({
        data: `<html><body>no token</body></html>`,
        headers: {},
      });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/path/16467-item.html"
    );

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns negative outcome when cart response is invalid json", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockRefreshMissThenCart({ status: 200, data: "<html>oops</html>" });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
    expectRefreshThenCartDelete(productUrl);
  });

  it("returns stock 0 and per-piece price from HTML when page is OOS", async () => {
    mockGet.mockResolvedValueOnce({
      data: `
        <html><head>
          <meta property="product:price:amount" content="331">
          <link itemprop="availability" href="https://schema.org/OutOfStock" />
        </head><body>
          <h1>Кулька латексна, 50 шт.</h1>
          <script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>
        </body></html>
      `,
      headers: {},
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/path/16467-item.html"
    );

    expect(result).toEqual({
      stock: 0,
      price: 6.62,
      title: "Кулька латексна, 50 шт.",
      source: "html-oos",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("OOS HTML fallback uses pack count from Штук в упаковці when title has no шт", async () => {
    mockGet.mockResolvedValueOnce({
      data: `
        <html><head>
          <meta property="product:price:amount" content="275">
          <link itemprop="availability" href="https://schema.org/OutOfStock" />
        </head><body>
          <h1>Кулька Gemar пастель</h1>
          <p>Штук в упаковці: 100</p>
          <script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>
        </body></html>
      `,
      headers: {},
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/path/16467-item.html"
    );

    expect(result).toEqual({
      stock: 0,
      price: 2.75,
      title: "Кулька Gemar пастель",
      source: "html-oos",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns negative outcome when in stock but no data-product and cart is empty", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      status: 200,
      data: `
        <html><head>
          <meta property="product:price:amount" content="100">
          <meta property="product:availability" content="in_stock" />
        </head><body>
          <h1>Товар без фасовки в назві</h1>
          <input type="hidden" name="token" value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
          <script>{"id_product":"16467"}</script>
        </body></html>
      `,
      headers: {},
    });
    mockRefreshMissThenCart({
      data: { success: true, cart: { products: [] } },
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
    expectRefreshThenCartDelete(productUrl);
  });

  it("sends combination fields in cart POST without TOC checkout fields", async () => {
    const productUrl = "https://perfectparty.in.ua/x/12115-3651-product.html";
    mockGet.mockResolvedValueOnce({
      data: `
        <form id="add-to-cart-or-refresh" action="/cart">
          <input type="hidden" name="token" value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
          <input type="hidden" name="id_product" value="12115" />
          <input type="radio" name="group[2]" value="5" checked />
        </form>
      `,
      headers: {},
    });
    mockRefreshMissThenCart({
      data: {
        cart: {
          products: [{ stock_quantity: 5, price_without_reduction: 553, name: "Товар" }],
        },
      },
    });

    await getPerfectStockData(productUrl);

    const addCall = mockPost.mock.calls.find((call) => {
      return call[0] === CART_URL && String(call[1]).includes("add=1");
    });
    const params = new URLSearchParams(String(addCall?.[1] ?? ""));
    expect(params.get("id_product_attribute")).toBe("3651");
    expect(params.get("group[2]")).toBe("5");
    expect(params.get("first_name")).toBeNull();
    expect(params.get("id_toc_state")).toBeNull();
  });

  it("uses data-product from page without calling cart", async () => {
    mockGet.mockResolvedValueOnce({
      status: 200,
      data: `
        <html><head>
          <meta property="product:availability" content="in_stock" />
        </head><body>
          <h1>Кулька, 50 шт</h1>
          <div id="product-details" data-product='{"quantity":5,"price_amount":553,"name":"Кулька"}'></div>
          <p>Штук в упаковці: 50</p>
        </body></html>
      `,
      headers: {},
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/x/12115-3651-product.html"
    );

    expect(result).toEqual({
      stock: 250,
      price: 11.06,
      title: "Кулька",
      source: "data-product",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("uses data-product quantity when related product is OOS", async () => {
    mockGet.mockResolvedValueOnce({
      status: 200,
      data: `
        <html><head>
          <meta property="product:availability" content="in_stock" />
        </head><body>
          <div id="product-details" data-product='{"quantity":4,"price_amount":100,"name":"Кулька"}'></div>
          <article class="product-miniature">
            <link itemprop="availability" href="https://schema.org/OutOfStock" />
          </article>
        </body></html>
      `,
      headers: {},
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/x/12115-product.html"
    );

    expect(result).toEqual({
      stock: 4,
      price: 100,
      title: "Кулька",
      source: "data-product",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("parses data-product when GET returns HTTP 500 with product HTML", async () => {
    mockGet.mockResolvedValueOnce({
      status: 500,
      data: `
        <html><head>
          <meta property="product:price:amount" content="553" />
        </head><body>
          <h1>Кулька, 50 шт</h1>
          <form id="add-to-cart-or-refresh"></form>
          <div id="product-details" data-product='{"quantity":5,"price_amount":553,"name":"Кулька"}'></div>
          <p>Штук в упаковці: 50</p>
        </body></html>
      `,
      headers: {},
    });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/x/12115-3651-product.html"
    );

    expect(result).toEqual({
      stock: 250,
      price: 11.06,
      title: "Кулька",
      source: "data-product",
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("uses refresh product_details without posting to cart", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: JSON.stringify({
        product_details: `<div id="product-details" data-product='{"quantity":7,"price_amount":40,"name":"Товар"}'></div>`,
      }),
    });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 7,
      price: 40,
      title: "Товар",
      source: "refresh",
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0]?.[0]).toBe(productUrl);
    expect(String(mockPost.mock.calls[0]?.[1])).toContain("action=refresh");
  });

  it("falls through to cart when refresh returns HTTP 400", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({ status: 400, data: "{}" })
      .mockResolvedValueOnce({
        status: 200,
        data: JSON.stringify({
          cart: {
            products: [{ stock_quantity: 2, price_without_reduction: 10, name: "Товар" }],
          },
        }),
      })
      .mockResolvedValueOnce({ status: 200, data: "{}" });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({
      stock: 2,
      price: 10,
      title: "Товар",
      source: "cart",
    });
    expectRefreshThenCartDelete(productUrl);
  });

  it("deletes from cart even when add throws", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: "{}" })
      .mockRejectedValueOnce(new Error("cart down"))
      .mockResolvedValueOnce({ status: 200, data: "{}" });

    const result = await getPerfectStockData(productUrl);

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
    const deleteCall = mockPost.mock.calls.find((call) =>
      String(call[1]).includes("delete=1")
    );
    expect(deleteCall?.[0]).toBe(CART_URL);
  });

  it("deletes from cart when add returns HTTP 400", async () => {
    const productUrl = "https://perfectparty.in.ua/path/16467-item.html";
    mockGet.mockResolvedValueOnce({
      data: `<script>{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id_product":"16467"}</script>`,
      headers: {},
    });
    mockRefreshMissThenCart({ status: 400, data: "{}" });

    const result = await getPerfectStockData(productUrl);

    expect(result.source).toBe("unavailable");
    expectRefreshThenCartDelete(productUrl);
  });

  it("returns unavailable when GET is HTTP 500 with empty body", async () => {
    mockGet.mockResolvedValueOnce({ status: 500, data: "" });

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/x/12115-3651-product.html"
    );

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns negative outcome on request failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await getPerfectStockData(
      "https://perfectparty.in.ua/path/16467-item.html"
    );

    expect(result).toEqual({ stock: -1, price: -1, source: "unavailable" });
  });

  it("throws on empty link", async () => {
    await expect(getPerfectStockData("")).rejects.toThrow(
      "Link is required and must be a string"
    );
  });
});
