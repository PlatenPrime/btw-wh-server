import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAirGroupPagesProducts } from "../getAirGroupPagesProducts.js";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { sleep } from "../../../../utils/sleep.js";
import {
  BrowserOriginBlockedError,
  ORIGIN_BLOCKED_CODE,
} from "../../../../utils/browserOriginBlockedError.js";

vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../utils/sleep.js");
vi.mock("../../../utils/airIdleMode.js", () => ({ AIR_IDLE_MODE: false }));
vi.mock("../../../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

const GROUP_URL = "https://air.example.test/ua/index.php?route=product/category&path=1";
const ORIGIN_URL = "https://air.example.test/";
const PAGE2_URL =
  "https://air.example.test/ua/index.php?route=product/category&path=1&page=2";

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

function airPageHtml(opts: {
  cards: string[];
  nextHref?: string;
  emptyMessage?: string;
}): string {
  const next =
    opts.nextHref != null
      ? `<link rel="next" href="${opts.nextHref}" />`
      : "";
  const grid =
    opts.cards.length > 0
      ? opts.cards.join("")
      : opts.emptyMessage != null
        ? `<p>${opts.emptyMessage}</p>`
        : "";
  return `<!DOCTYPE html><html><head>${next}</head><body>
<div class="row us-category-products">${grid}</div>
</body></html>`;
}

const listingFetchOpts = {
  konkName: "air",
  transport: "impit",
  proxyUrl: undefined,
  headers: {
    Referer: ORIGIN_URL,
    "Sec-Fetch-Site": "same-origin",
  },
};

describe("getAirGroupPagesProducts", () => {
  const originalProxy = process.env.AIR_HTTP_PROXY_URL;

  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(sleep).mockResolvedValue(undefined);
    delete process.env.AIR_HTTP_PROXY_URL;
  });

  afterEach(() => {
    if (originalProxy === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = originalProxy;
    }
  });

  it("parses products across two pages with origin warm-up", async () => {
    const html1 = airPageHtml({
      cards: [
        airProductCard({
          pid: "111",
          productPath: "/ua/product/p111",
          imageUrl: "https://air.example.test/image/cache/a.jpg",
          title: "Balloon &#34;10&quot;",
        }),
      ],
      nextHref: PAGE2_URL,
    });
    const html2 = airPageHtml({
      cards: [
        airProductCard({
          pid: "222",
          productPath: "/ua/product/p222",
          imageUrl: "https://air.example.test/image/cache/b.jpg",
          title: "Other",
        }),
      ],
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) return "<html>home</html>";
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getAirGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result).toHaveLength(2);
    expect(fetchPageHtml).toHaveBeenNthCalledWith(1, ORIGIN_URL, listingFetchOpts);
    expect(fetchPageHtml).toHaveBeenCalledWith(GROUP_URL, listingFetchOpts);
    expect(fetchPageHtml).toHaveBeenCalledWith(PAGE2_URL, listingFetchOpts);

    const p1 = result.find((p) => p.productId === "111");
    expect(p1?.url).toBe("https://air.example.test/ua/product/p111");
    expect(p1?.title).not.toContain("&#");
    expect(p1?.title).toContain("10");
    const p2 = result.find((p) => p.productId === "222");
    expect(p2?.url).toBe("https://air.example.test/ua/product/p222");
  });

  it("stops when a later page has no product cards (no Ukrainian text needed)", async () => {
    const html1 = airPageHtml({
      cards: [
        airProductCard({
          pid: "1",
          productPath: "/ua/product/a",
          imageUrl: "https://air.example.test/a.jpg",
          title: "Only first page",
        }),
      ],
      nextHref: PAGE2_URL,
    });
    const html2 = airPageHtml({ cards: [] });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) return "<html>home</html>";
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getAirGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("1");
    // warm-up + page1 + page2
    expect(vi.mocked(fetchPageHtml)).toHaveBeenCalledTimes(3);
  });

  it("regression: empty grid with Ukrainian message still stops", async () => {
    const html1 = airPageHtml({
      cards: [
        airProductCard({
          pid: "1",
          productPath: "/ua/product/a",
          imageUrl: "https://air.example.test/a.jpg",
          title: "A",
        }),
      ],
      nextHref: PAGE2_URL,
    });
    const html2 = airPageHtml({
      cards: [],
      emptyMessage: "У даній категорії немає товарів.",
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) return "<html>home</html>";
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getAirGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result).toHaveLength(1);
  });

  it("uses data-srcset when src is lazy placeholder", async () => {
    const real =
      "https://air.example.test/image/cache/catalog/x-228x228.jpg";
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "9",
          productPath: "/ua/product/z",
          imageUrl: "https://air.example.test/image/catalog/1lazy/lazy-image.svg",
          title: "Z",
        }).replace(
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg"`,
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg" data-srcset="${real} 100w"`
        ),
      ],
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) return "<html>home</html>";
      return html;
    });

    const result = await getAirGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.imageUrl).toBe(real);
  });

  it("не передаёт proxyUrl пока AIR_HTTP_PROXY_ENABLED=false, даже если env задан", async () => {
    process.env.AIR_HTTP_PROXY_URL =
      "http://user:secret@77.47.252.164:50100";
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "1",
          productPath: "/ua/product/a",
          imageUrl: "https://air.example.test/a.jpg",
          title: "A",
        }),
      ],
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) return "<html>home</html>";
      return html;
    });

    await getAirGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 1 });

    expect(fetchPageHtml).toHaveBeenCalledWith(GROUP_URL, {
      konkName: "air",
      transport: "impit",
      proxyUrl: undefined,
      headers: {
        Referer: ORIGIN_URL,
        "Sec-Fetch-Site": "same-origin",
      },
    });
  });

  it("continues crawl when warm-up fails", async () => {
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "1",
          productPath: "/ua/product/a",
          imageUrl: "https://air.example.test/a.jpg",
          title: "A",
        }),
      ],
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === ORIGIN_URL) {
        throw new Error("warmup 429");
      }
      return html;
    });

    const result = await getAirGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(result).toHaveLength(1);
    expect(fetchPageHtml).toHaveBeenCalledWith(GROUP_URL, listingFetchOpts);
  });

  it("rethrows ORIGIN_BLOCKED on listing warm-up without crawl", async () => {
    const blocked = new BrowserOriginBlockedError("cf 520", {
      httpStatus: 520,
      retryAfterSec: 60,
    });
    vi.mocked(fetchPageHtml).mockRejectedValue(blocked);

    await expect(
      getAirGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 1 })
    ).rejects.toMatchObject({
      code: ORIGIN_BLOCKED_CODE,
      httpStatus: 520,
    });
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
    expect(fetchPageHtml).toHaveBeenCalledWith(ORIGIN_URL, listingFetchOpts);
  });
});
