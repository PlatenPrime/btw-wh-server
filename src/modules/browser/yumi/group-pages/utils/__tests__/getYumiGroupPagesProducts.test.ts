import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYumiGroupPagesProducts } from "../getYumiGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js");

const GROUP_URL = "https://example.test/cat";
const PAGE2_URL = "https://example.test/cat?page=2";

function pageHtml(opts: {
  productId: string;
  titleAttr: string;
  productPath: string;
  imageUrl: string;
  nextHref?: string;
}): string {
  const next =
    opts.nextHref != null
      ? `<link rel="next" href="${opts.nextHref}" />`
      : "";
  return `<!DOCTYPE html><html><head>${next}</head><body>
<button type="button" data-qaid="buy-button" data-product-id="${opts.productId}"
  data-product-name="${opts.titleAttr}"
  data-product-url="${opts.productPath}"
  data-product-big-picture="${opts.imageUrl}"></button>
</body></html>`;
}

describe("getYumiGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  it("parses products across two pages", async () => {
    const html1 = pageHtml({
      productId: "111",
      titleAttr: 'Widget &#34;10&quot;',
      productPath: "/p111.html",
      imageUrl: "https://images.prom.ua/a.jpg",
      nextHref: PAGE2_URL,
    });
    const html2 = pageHtml({
      productId: "222",
      titleAttr: "Other",
      productPath: "/p222.html",
      imageUrl: "https://images.prom.ua/b.jpg",
    });

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getYumiGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result).toHaveLength(2);
    const p1 = result.find((p) => p.productId === "111");
    expect(p1?.url).toBe("https://example.test/p111.html");
    expect(p1?.title).not.toContain("&#");
    expect(p1?.title).toContain("10");
    const p2 = result.find((p) => p.productId === "222");
    expect(p2?.url).toBe("https://example.test/p222.html");
  });

  it("stops on pagination loop (visited set)", async () => {
    const loopNext = "https://example.test/cat/p2";
    const htmlLoop = pageHtml({
      productId: "819105543",
      titleAttr: "Loop item",
      productPath: "/p819.html",
      imageUrl: "https://images.prom.ua/819.jpg",
      nextHref: loopNext,
    });

    vi.mocked(browserGet).mockImplementation(async () => htmlLoop);

    const result = await getYumiGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 10,
    });

    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(browserGet).mock.calls.map((c) => c[0]);
    expect(calls).toContain(GROUP_URL);
    expect(calls).toContain(loopNext);
    expect(result.some((p) => p.productId === "928707587")).toBe(false);
    expect(result.some((p) => p.productId === "819105543")).toBe(true);
  });

  it("parses out-of-stock product-block without buy button", async () => {
    const html = `<!DOCTYPE html><html><head></head><body>
<li class="b-product-gallery__item" data-qaid="product-block" data-product-id="2688595028">
  <a class="b-product-gallery__image-link" href="/p2688595028-z.html" title="OOS">
    <img class="b-product-gallery__image" src="https://images.prom.ua/oos.jpg" alt="" />
  </a>
  <div class="b-product-gallery__details-panel">
    <a class="b-product-gallery__title" href="/p2688595028-z.html">OOS product</a>
  </div>
  <div class="b-product-gallery__order-bar"><div class="b-drop-phones"></div></div>
</li>
</body></html>`;

    vi.mocked(browserGet).mockImplementation(async () => html);

    const result = await getYumiGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("2688595028");
    expect(result[0]?.url).toBe("https://example.test/p2688595028-z.html");
    expect(result[0]?.title).toBe("OOS product");
    expect(result[0]?.imageUrl).toBe("https://images.prom.ua/oos.jpg");
  });
});
