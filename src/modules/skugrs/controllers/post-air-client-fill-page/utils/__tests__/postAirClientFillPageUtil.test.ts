import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { postAirClientFillPageUtil } from "../postAirClientFillPageUtil.js";

const GROUP_URL =
  "https://airballoons.com.ua/ua/index.php?route=product/category&path=1";
const PAGE2_URL = `${GROUP_URL}&page=2`;

const productOne = {
  productId: "111",
  title: "One",
  url: "https://airballoons.com.ua/ua/product/p111",
  imageUrl: "https://airballoons.com.ua/img/a.jpg",
};

function payload(
  overrides: Partial<Parameters<typeof postAirClientFillPageUtil>[0]> = {}
) {
  return {
    id: "507f1f77bcf86cd799439011",
    sourceUrl: GROUP_URL,
    pageUrl: GROUP_URL,
    products: [] as typeof productOne[],
    nextPageUrl: null as string | null,
    hasListingMarkup: true,
    ...overrides,
  };
}

describe("postAirClientFillPageUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns SKUGR_NOT_FOUND", async () => {
    const result = await postAirClientFillPageUtil(payload());
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
    const result = await postAirClientFillPageUtil(
      payload({ id: skugr._id.toString() })
    );
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
    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        sourceUrl: "https://airballoons.com.ua/other",
      })
    );
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
    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        pageUrl: "https://airballoons.com.ua/ua/product/x",
      })
    );
    expect(result).toMatchObject({ ok: false, code: "PAGE_URL_MISMATCH" });
  });

  it("returns PARSE_FAILED when no products and no listing markup", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });
    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        hasListingMarkup: false,
      })
    );
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

    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        products: [productOne],
        nextPageUrl: PAGE2_URL,
      })
    );

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

    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        nextPageUrl: PAGE2_URL,
      })
    );

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

    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        pageUrl: PAGE2_URL,
        products: [
          {
            productId: "222",
            title: "Two",
            url: "https://airballoons.com.ua/ua/product/p222",
            imageUrl: "https://airballoons.com.ua/img/b.jpg",
          },
        ],
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.productsOnPage).toBe(1);
      expect(result.nextPageUrl).toBeNull();
    }
  });

  it("nulls nextPageUrl that is not a listing page of the group", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "acme",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });

    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        products: [productOne],
        nextPageUrl:
          "https://airballoons.com.ua/ua/index.php?route=product/category&path=999&page=3",
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextPageUrl).toBeNull();
      expect(result.stats.created).toBe(1);
    }
  });

  it("fills products even without listing markup", async () => {
    const skugr = await Skugr.create({
      konkName: "air",
      prodName: "acme",
      title: "A",
      url: GROUP_URL,
      skus: [],
    });

    const result = await postAirClientFillPageUtil(
      payload({
        id: skugr._id.toString(),
        products: [productOne],
        hasListingMarkup: false,
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stats.created).toBe(1);
    }
  });
});
