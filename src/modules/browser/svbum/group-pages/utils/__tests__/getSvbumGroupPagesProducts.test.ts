import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cheerio from "cheerio";
import {
  getSvbumGroupPagesProducts,
  getSvbumNextPageUrl,
} from "../getSvbumGroupPagesProducts.js";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { sleep } from "../../../../utils/sleep.js";
import { getGroupPagesThrottleDelayMs } from "../../../../group-pages/config/groupPagesThrottle.js";

vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../utils/sleep.js", () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../../../group-pages/config/groupPagesThrottle.js", () => ({
  getGroupPagesThrottleDelayMs: vi.fn(() => 0),
}));

const GROUP_URL =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=F2S2V1646816252F6S2V1054752947";
const PAGE2_NO_OCF =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?page=2";
const PAGE2_WITH_OCF =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?page=2&ocf=F2S2V1646816252F6S2V1054752947";
const PAGE3_WITH_OCF =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=F2S2V1646816252F6S2V1054752947&page=3";

function card(opts: {
  productId: string;
  href: string;
  title: string;
  imageSrc: string;
}): string {
  return `<li class="product-layout product-grid">
  <div class="product-thumb">
    <div class="image"><img src="${opts.imageSrc}" alt="${opts.title}" /></div>
    <div class="product-title"><a href="${opts.href}">${opts.title}</a></div>
    <button class="btn btn-red" type="button" data-p_id="${opts.productId}">Купити</button>
  </div>
</li>`;
}

function pageHtml(opts: {
  product: {
    productId: string;
    href: string;
    title: string;
    imageSrc: string;
  };
  nextHref?: string;
  forwardHref?: string;
}): string {
  const next =
    opts.nextHref != null ? `<link rel="next" href="${opts.nextHref}" />` : "";
  const forward =
    opts.forwardHref != null
      ? `<ul class="pagination"><li class="paination-text"><a href="https://sviatobum.ua/back">Назад</a></li><li class="paination-text"><a href="${opts.forwardHref}">Вперед</a></li></ul>`
      : `<ul class="pagination"><li class="active"><span>1</span></li></ul>`;
  return `<!DOCTYPE html><html><head>${next}</head><body>
<ul class="row">${card(opts.product)}</ul>
<div class="row"><div class="col-xs-12 text-center">${forward}</div></div>
</body></html>`;
}

describe("getSvbumNextPageUrl", () => {
  it("prefers link rel=next over pagination Вперед", () => {
    const $ = cheerio.load(
      pageHtml({
        product: {
          productId: "1",
          href: "https://sviatobum.ua/p/1",
          title: "One",
          imageSrc: "https://sviatobum.ua/img/1.webp",
        },
        nextHref: PAGE2_NO_OCF,
        forwardHref: PAGE3_WITH_OCF,
      })
    );
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBe(PAGE2_NO_OCF);
  });

  it("falls back to pagination Вперед when rel=next is absent", () => {
    const $ = cheerio.load(
      pageHtml({
        product: {
          productId: "1",
          href: "https://sviatobum.ua/p/1",
          title: "One",
          imageSrc: "https://sviatobum.ua/img/1.webp",
        },
        forwardHref: PAGE3_WITH_OCF,
      })
    );
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBe(PAGE3_WITH_OCF);
  });

  it("returns null on last page without next or Вперед", () => {
    const $ = cheerio.load(
      pageHtml({
        product: {
          productId: "1",
          href: "https://sviatobum.ua/p/1",
          title: "One",
          imageSrc: "https://sviatobum.ua/img/1.webp",
        },
      })
    );
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBeNull();
  });
});

describe("getSvbumGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(sleep).mockClear();
    vi.mocked(getGroupPagesThrottleDelayMs).mockClear();
  });

  it("throws on invalid groupUrl", async () => {
    await expect(
      getSvbumGroupPagesProducts({ groupUrl: "not-a-url" })
    ).rejects.toThrow();
  });

  it("throws on maxPages out of range", async () => {
    await expect(
      getSvbumGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 0 })
    ).rejects.toThrow();
    await expect(
      getSvbumGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 201 })
    ).rejects.toThrow();
  });

  it("parses products across two pages via rel=next and preserves ocf", async () => {
    const html1 = pageHtml({
      product: {
        productId: "10314",
        href: "/povitryani-kuli/item-a",
        title: "First &amp; one",
        imageSrc: "https://sviatobum.ua/img/a.webp",
      },
      nextHref: PAGE2_NO_OCF,
    });
    const html2 = pageHtml({
      product: {
        productId: "5014",
        href: "https://sviatobum.ua/povitryani-kuli/item-b",
        title: "Second",
        imageSrc: "https://sviatobum.ua/img/b.webp",
      },
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_WITH_OCF) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getSvbumGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result).toHaveLength(2);
    const p1 = result.find((p) => p.productId === "10314");
    expect(p1?.url).toBe("https://sviatobum.ua/povitryani-kuli/item-a");
    expect(p1?.title).toContain("&");
    expect(p1?.title).not.toContain("&amp;");
    const p2 = result.find((p) => p.productId === "5014");
    expect(p2?.url).toBe("https://sviatobum.ua/povitryani-kuli/item-b");

    const calls = vi.mocked(fetchPageHtml).mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe(GROUP_URL);
    expect(calls[1]).toBe(PAGE2_WITH_OCF);
    expect(vi.mocked(fetchPageHtml).mock.calls[0]?.[1]).toEqual({
      konkName: "svbum",
    });
    expect(getGroupPagesThrottleDelayMs).toHaveBeenCalledWith("svbum");
  });

  it("stops on last page without fetching further", async () => {
    const lastHtml = pageHtml({
      product: {
        productId: "4990",
        href: "https://sviatobum.ua/p/oos",
        title: "Last",
        imageSrc: "https://sviatobum.ua/img/last.webp",
      },
    });
    vi.mocked(fetchPageHtml).mockResolvedValue(lastHtml);

    const result = await getSvbumGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("4990");
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
  });

  it("follows pagination Вперед when rel=next is missing", async () => {
    const html1 = pageHtml({
      product: {
        productId: "1",
        href: "https://sviatobum.ua/p/1",
        title: "One",
        imageSrc: "https://sviatobum.ua/img/1.webp",
      },
      forwardHref: PAGE3_WITH_OCF,
    });
    const html2 = pageHtml({
      product: {
        productId: "2",
        href: "https://sviatobum.ua/p/2",
        title: "Two",
        imageSrc: "https://sviatobum.ua/img/2.webp",
      },
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE3_WITH_OCF) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getSvbumGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result.map((p) => p.productId).sort()).toEqual(["1", "2"]);
    expect(vi.mocked(fetchPageHtml).mock.calls.map((c) => c[0])).toEqual([
      GROUP_URL,
      PAGE3_WITH_OCF,
    ]);
  });

  it("stops on empty listing page", async () => {
    vi.mocked(fetchPageHtml).mockResolvedValue(
      `<!DOCTYPE html><html><head><link rel="next" href="${PAGE2_NO_OCF}" /></head><body><ul class="row"></ul></body></html>`
    );

    const result = await getSvbumGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result).toEqual([]);
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
  });
});
