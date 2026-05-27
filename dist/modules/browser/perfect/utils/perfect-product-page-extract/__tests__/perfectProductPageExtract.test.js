import { describe, expect, it } from "vitest";
import { buildPerfectAddToCartBody, extractProductAttributeId, extractProductGroupSelections, extractProductId, extractTitle, extractToken, } from "../perfectProductPageExtract.js";
describe("extractToken", () => {
    it("prefers add-to-cart form token over prestashop session token", () => {
        const html = `
      <form id="add-to-cart-or-refresh">
        <input type="hidden" name="token" value="6d4fbac909e9ee488086197d848ba70e">
      </form>
      <script>var prestashop = {"static_token":"6d4fbac909e9ee488086197d848ba70e","token":"42f420d0ff1adc197364c4c9653d1dd0"};</script>`;
        expect(extractToken(html)).toBe("6d4fbac909e9ee488086197d848ba70e");
    });
    it("uses static_token when form input is absent", () => {
        const html = '{"static_token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","token":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}';
        expect(extractToken(html)).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });
    it("falls back to session token in prestashop JSON", () => {
        const html = '{"token":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","id_product":"1"}';
        expect(extractToken(html)).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    });
    it("returns null when absent", () => {
        expect(extractToken("<html></html>")).toBeNull();
    });
});
describe("extractProductId", () => {
    it("prefers id from product URL", () => {
        expect(extractProductId("{}", "https://perfectparty.in.ua/x/16467-product.html")).toBe("16467");
    });
    it("falls back to HTML patterns", () => {
        expect(extractProductId('{"id_product":"99"}', "")).toBe("99");
    });
});
describe("extractTitle", () => {
    it("prefers h1 over og:title", () => {
        const html = `
      <html><head><meta property="og:title" content="OG"></head>
      <body><h1>Real title</h1></body></html>`;
        expect(extractTitle(html)).toBe("Real title");
    });
    it("uses og:title when no h1", () => {
        const html = `<head><meta property="og:title" content="OG only"></head>`;
        expect(extractTitle(html)).toBe("OG only");
    });
});
describe("extractProductAttributeId", () => {
    it("reads combination id from product URL", () => {
        expect(extractProductAttributeId("{}", "https://perfectparty.in.ua/x/12115-3651-product.html")).toBe("3651");
    });
    it("falls back to HTML id_product_attribute", () => {
        expect(extractProductAttributeId('{"id_product_attribute":99}', "")).toBe("99");
    });
    it("returns null for simple product URL without combination", () => {
        expect(extractProductAttributeId("{}", "https://perfectparty.in.ua/x/16467-product.html")).toBeNull();
    });
});
describe("extractProductGroupSelections", () => {
    it("reads checked group inputs from add-to-cart form", () => {
        const html = `
      <form id="add-to-cart-or-refresh" action="/cart">
        <input type="radio" name="group[2]" value="5" checked />
        <input type="radio" name="group[2]" value="6" />
      </form>`;
        expect(extractProductGroupSelections(html)).toEqual({ "2": "5" });
    });
});
describe("buildPerfectAddToCartBody", () => {
    it("builds PrestaShop add-to-cart fields without checkout extras", () => {
        const body = buildPerfectAddToCartBody({
            token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            idProduct: "12115",
            idProductAttribute: "3651",
            groupSelections: { "2": "5" },
        });
        const params = new URLSearchParams(body);
        expect(params.get("token")).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        expect(params.get("id_product")).toBe("12115");
        expect(params.get("id_product_attribute")).toBe("3651");
        expect(params.get("group[2]")).toBe("5");
        expect(params.get("add")).toBe("1");
        expect(params.get("action")).toBe("update");
        expect(params.get("first_name")).toBeNull();
        expect(params.get("id_toc_state")).toBeNull();
    });
});
