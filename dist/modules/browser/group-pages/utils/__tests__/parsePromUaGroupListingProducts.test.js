import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parsePromUaGroupListingProducts } from "../parsePromUaGroupListingProducts.js";
const BASE = "https://balun.example.test/ua/g1";
describe("parsePromUaGroupListingProducts", () => {
    it("parses out-of-stock product-block without buy button", () => {
        const html = `<!DOCTYPE html><html><body>
<li class="b-product-gallery__item" data-qaid="product-block" data-product-id="2688595028">
  <a class="b-product-gallery__image-link" href="/ua/p2688595028-z.html" title="Star &#34;Wish&#34;">
    <img class="b-product-gallery__image" src="https://images.prom.ua/x.jpg" alt="" />
  </a>
  <div class="b-product-gallery__details-panel">
    <a class="b-product-gallery__title" href="/ua/p2688595028-z.html">Title from link</a>
  </div>
  <div class="b-product-gallery__order-bar"><div class="b-drop-phones"></div></div>
</li>
</body></html>`;
        const $ = cheerio.load(html);
        const map = parsePromUaGroupListingProducts($, BASE);
        const p = map.get("2688595028");
        expect(p).toBeDefined();
        expect(p?.url).toBe("https://balun.example.test/ua/p2688595028-z.html");
        expect(p?.title).toBe("Title from link");
        expect(p?.imageUrl).toBe("https://images.prom.ua/x.jpg");
    });
    it("prefers buy-button data when same product appears in product-block", () => {
        const html = `<!DOCTYPE html><html><body>
<li data-qaid="product-block" data-product-id="111">
  <a class="b-product-gallery__image-link" href="/ua/p111-wrong.html"><img src="https://x/wrong.jpg" /></a>
  <a class="b-product-gallery__title" href="/ua/p111-wrong.html">Wrong title</a>
</li>
<button data-qaid="buy-button" data-product-id="111"
  data-product-name="From&#32;Button"
  data-product-url="/ua/p111.html"
  data-product-big-picture="https://images.prom.ua/right.jpg"></button>
</body></html>`;
        const $ = cheerio.load(html);
        const p = parsePromUaGroupListingProducts($, BASE).get("111");
        expect(p?.title).toBe("From Button");
        expect(p?.url).toBe("https://balun.example.test/ua/p111.html");
        expect(p?.imageUrl).toBe("https://images.prom.ua/right.jpg");
    });
    it("uses image-link title when title link text is empty", () => {
        const html = `<!DOCTYPE html><html><body>
<li data-qaid="product-block" data-product-id="222">
  <a class="b-product-gallery__image-link" href="/ua/p222.html" title="Only &#34;title&#34; attr">
    <img src="https://images.prom.ua/t.jpg" />
  </a>
  <a class="b-product-gallery__title" href="/ua/p222.html"></a>
</li>
</body></html>`;
        const $ = cheerio.load(html);
        const p = parsePromUaGroupListingProducts($, BASE).get("222");
        expect(p?.title).toContain("Only");
        expect(p?.title).toContain('"');
    });
});
