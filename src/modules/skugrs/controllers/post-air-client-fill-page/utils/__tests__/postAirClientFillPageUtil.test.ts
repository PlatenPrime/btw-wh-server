import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { postAirClientFillPageUtil } from "../postAirClientFillPageUtil.js";

const GROUP_URL =
  "https://airballoons.com.ua/ua/index.php?route=product/category&path=1";
const PAGE2_URL = `${GROUP_URL}&page=2`;

function airProductCard(opts: {
  pid: string;
  productPath: string;
  imageUrl: string;
  title: string;
}): string {
  return `<div class="product-layout product-grid" data-pid="${opts.pid}">
    <div class="us-module-img">
      <a href="${opts.productPath}">
        <img src="${opts.imageUrl}" alt="" />
      </a>
    </div>
    <div class="us-module-title">
      <a href="${opts.productPath}">${opts.title}</a>
    </div>
  </div>`;
}

function airPageHtml(opts: { cards: string[]; nextHref?: string }): string {
  const next =
    opts.nextHref != null
      ? `<link rel="next" href="${opts.nextHref}" />`
      : "";
  return `<!DOCTYPE html><html><head>${next}</head><body>
    <div class="row us-category-products">${opts.cards.join("")}</div>
  </body></html>`;
}

describe("postAirClientFillPageUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns SKUGR_NOT_FOUND", async () => {
    const result = await postAirClientFillPageUtil({
      id: "507f1f77bcf86cd799439011",
      sourceUrl: GROUP_URL,
      pageUrl: GROUP_URL,
      html: "<html></html>",
    });
    expect(result).toMatchObject({ ok: false, code: "SKUGR_NOT_FOUND" });
  });

  it("returns NOT_AIR for other competitor", async () => {
    const skugr = await Skugr.create({
      konkName: "balun",
      prodName: "p",
      title: "B",
      url: GROUP_URL,
      skus: [],
    });
    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: GROUP_URL,
      html: "<html></html>",
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_AIR" });
  });

  it("returns URL_MISMATCH", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: "https://airballoons.com.ua/other",
      pageUrl: GROUP_URL,
      html: "<html></html>",
    });
    expect(result).toMatchObject({ ok: false, code: "URL_MISMATCH" });
  });

  it("returns PAGE_URL_MISMATCH", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: "https://airballoons.com.ua/ua/product/x",
      html: "<html></html>",
    });
    expect(result).toMatchObject({ ok: false, code: "PAGE_URL_MISMATCH" });
  });

  it("returns PARSE_FAILED for WAF html", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: GROUP_URL,
      html: "<html><body>Захищена сторінка</body></html>",
    });
    expect(result).toMatchObject({ ok: false, code: "PARSE_FAILED" });
  });

  it("fills products and returns nextPageUrl", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "acme",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "111",
          productPath: "/ua/product/p111",
          imageUrl: "https://airballoons.com.ua/img/a.jpg",
          title: "One",
        }),
      ],
      nextHref: PAGE2_URL,
    });

    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: GROUP_URL,
      html,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.productsOnPage).toBe(1);
      expect(result.nextPageUrl).toBe(PAGE2_URL);
      expect(result.stats.created).toBe(1);
    }

    const sku = await Sku.findOne({ productId: "air-111" }).lean();
    expect(sku?.title).toBe("One");
  });

  it("empty category returns 0 products and null nextPageUrl", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const html = airPageHtml({ cards: [] });

    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: GROUP_URL,
      html,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.productsOnPage).toBe(0);
      expect(result.nextPageUrl).toBeNull();
      expect(result.stats.fetched).toBe(0);
    }
  });

  it("accepts pagination page=2", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "acme",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "222",
          productPath: "/ua/product/p222",
          imageUrl: "https://airballoons.com.ua/img/b.jpg",
          title: "Two",
        }),
      ],
    });

    const result = await postAirClientFillPageUtil({
      id: skugr._id.toString(),
      sourceUrl: GROUP_URL,
      pageUrl: PAGE2_URL,
      html,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.productsOnPage).toBe(1);
      expect(result.nextPageUrl).toBeNull();
    }
  });
});
