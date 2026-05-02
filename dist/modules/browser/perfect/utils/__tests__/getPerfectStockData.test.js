import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerfectStockData } from "../getPerfectStockData.js";
import { getBrowserAxios } from "../../../utils/browserRequest.js";
vi.mock("../../../utils/browserRequest.js", () => ({
    getBrowserAxios: vi.fn(),
    logBrowserError: vi.fn(),
}));
describe("getPerfectStockData", () => {
    const mockGet = vi.fn();
    const mockPost = vi.fn();
    beforeEach(() => {
        mockGet.mockReset();
        mockPost.mockReset();
        vi.mocked(getBrowserAxios).mockReturnValue({
            get: mockGet,
            post: mockPost,
        });
    });
    it("returns stock and price per piece when title has pack count", async () => {
        mockGet.mockResolvedValueOnce({
            data: `
        <html><head>
          <meta property="og:title" content="Кулька 10 шт. в уп.">
        </head><body>
          <script>var prestashop = {"token":"abc123abc123abc123","id_product":"16467"};</script>
        </body></html>
      `,
            headers: {
                "set-cookie": ["PHPSESSID=abc; path=/", "PrestaShop-foo=bar; path=/"],
            },
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({
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
            }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/bez-malyunku-po-10-sht20-sht/16467-product.html");
        expect(result).toEqual({
            stock: 90,
            price: 4.5,
            title: "Кулька 10 шт. в уп.",
        });
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith("https://perfectparty.in.ua/cart", expect.any(String), expect.objectContaining({
            headers: expect.objectContaining({
                Cookie: expect.stringContaining("PHPSESSID=abc"),
            }),
        }));
    });
    it("uses pack count from product HTML when title has no N шт", async () => {
        mockGet.mockResolvedValueOnce({
            data: `
        <html><head>
          <meta property="og:title" content="Кулька Gemar пастель">
        </head><body>
          <p>Штук в упаковці: 100</p>
          <script>var prestashop = {"token":"abc123abc123abc123","id_product":"16467"};</script>
        </body></html>
      `,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({
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
            }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/test/16467-product.html");
        expect(result).toEqual({
            stock: 100,
            price: 2.75,
            title: 'Кулька Gemar 12"/57 КП Пастель яскраво-рожевий',
        });
    });
    it("returns stock and price as is when pack count is absent", async () => {
        mockGet.mockResolvedValueOnce({
            data: `
        <html><head>
          <meta property="og:title" content="Кулька без фасовки">
        </head><body>
          <script>window.data={"token":"abc123abc123abc123","id_product":"16467"};</script>
        </body></html>
      `,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({
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
            }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/test/16467-product.html");
        expect(result).toEqual({
            stock: 9,
            price: 45,
            title: "Кулька без фасовки",
        });
    });
    it("uses embedded price fallback when direct price is absent", async () => {
        mockGet.mockResolvedValueOnce({
            data: `<script>{"token":"abc123abc123abc123","id_product":"16467"}</script>`,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({
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
            }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result.stock).toBe(3);
        expect(result.price).toBe(99.9);
    });
    it("uses cart?action=show fallback when token is missing in product page", async () => {
        mockGet
            .mockResolvedValueOnce({
            data: `<html><body>{"id_product":"16467"}</body></html>`,
            headers: { "set-cookie": ["PHPSESSID=abc; path=/"] },
        })
            .mockResolvedValueOnce({
            data: `<a href="/cart?update=1&id_product=16467&token=fedcfedcfedcfedc">u</a>`,
            headers: { "set-cookie": ["PrestaShop-foo=bar; path=/"] },
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({
                cart: {
                    products: [{ stock_quantity: 5, price_without_reduction: 50, name: "Товар" }],
                },
            }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({ stock: 5, price: 50, title: "Товар" });
        expect(mockGet).toHaveBeenNthCalledWith(2, "https://perfectparty.in.ua/cart?action=show", expect.objectContaining({
            headers: expect.objectContaining({
                Cookie: expect.stringContaining("PHPSESSID=abc"),
            }),
        }));
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
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({ stock: -1, price: -1 });
        expect(mockPost).not.toHaveBeenCalled();
    });
    it("returns negative outcome when cart response is invalid json", async () => {
        mockGet.mockResolvedValueOnce({
            data: `<script>{"token":"abc123abc123abc123","id_product":"16467"}</script>`,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({ data: "<html>oops</html>" });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({ stock: -1, price: -1 });
    });
    it("returns stock 0 and per-piece price from HTML when cart has no product (OOS)", async () => {
        mockGet.mockResolvedValueOnce({
            data: `
        <html><head>
          <meta property="product:price:amount" content="331">
          <link itemprop="availability" href="https://schema.org/OutOfStock" />
        </head><body>
          <h1>Кулька латексна, 50 шт.</h1>
          <script>{"token":"abc123abc123abc123","id_product":"16467"}</script>
        </body></html>
      `,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({ success: true, cart: { products: [] } }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({
            stock: 0,
            price: 6.62,
            title: "Кулька латексна, 50 шт.",
        });
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
          <script>{"token":"abc123abc123abc123","id_product":"16467"}</script>
        </body></html>
      `,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({ success: true, cart: { products: [] } }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({
            stock: 0,
            price: 2.75,
            title: "Кулька Gemar пастель",
        });
    });
    it("does not use HTML fallback when page looks in stock but cart is empty", async () => {
        mockGet.mockResolvedValueOnce({
            data: `
        <html><head>
          <meta property="product:price:amount" content="100">
          <meta property="product:availability" content="in_stock" />
        </head><body>
          <h1>Товар без фасовки в назві</h1>
          <script>{"token":"abc123abc123abc123","id_product":"16467"}</script>
        </body></html>
      `,
            headers: {},
        });
        mockPost.mockResolvedValueOnce({
            data: JSON.stringify({ success: true, cart: { products: [] } }),
        });
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({ stock: -1, price: -1 });
    });
    it("returns negative outcome on request failure", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network error"));
        const result = await getPerfectStockData("https://perfectparty.in.ua/path/16467-item.html");
        expect(result).toEqual({ stock: -1, price: -1 });
    });
    it("throws on empty link", async () => {
        await expect(getPerfectStockData("")).rejects.toThrow("Link is required and must be a string");
    });
});
