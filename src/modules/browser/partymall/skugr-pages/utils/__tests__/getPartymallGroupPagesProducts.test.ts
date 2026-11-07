import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPartymallGroupPagesProducts } from "../getPartymallGroupPagesProducts.js";
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
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?ocf=F31S2V3127113339";
const PAGE2_NO_OCF =
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?page=2";
const PAGE2_WITH_OCF =
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?page=2&ocf=F31S2V3127113339";

function card(opts: { productId: string; href: string; title: string; imageSrc: string }): string {
  return `<div class="ds-module-item product-layout" data-pid="${opts.productId}">
    <div class="ds-module-img-box"><img src="${opts.imageSrc}" alt="${opts.title}" /></div>
    <a href="${opts.href}" class="ds-module-title">${opts.title}</a>
  </div>`;
}

function pageHtml(opts: {
  product: {
    productId: string;
    href: string;
    title: string;
    imageSrc: string;
  };
  nextHref?: string;
}): string {
  const next = opts.nextHref != null ? `<link rel="next" href="${opts.nextHref}" />` : "";
  return `<!DOCTYPE html><html><head>${next}</head><body>
<div class="ds-category-products">${card(opts.product)}</div>
</body></html>`;
}

describe("getPartymallGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(sleep).mockClear();
    vi.mocked(getGroupPagesThrottleDelayMs).mockClear();
  });

  it("throws on invalid groupUrl", async () => {
    await expect(getPartymallGroupPagesProducts({ groupUrl: "not-a-url" })).rejects.toThrow();
  });

  it("throws on maxPages out of range", async () => {
    await expect(
      getPartymallGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 0 }),
    ).rejects.toThrow();
    await expect(
      getPartymallGroupPagesProducts({ groupUrl: GROUP_URL, maxPages: 201 }),
    ).rejects.toThrow();
  });

  it("parses products across two pages via rel=next and preserves ocf", async () => {
    const html1 = pageHtml({
      product: {
        productId: "1064",
        href: "/item-a",
        title: "First &amp; one",
        imageSrc: "https://partymall.ua/img/a.webp",
      },
      nextHref: PAGE2_NO_OCF,
    });
    const html2 = pageHtml({
      product: {
        productId: "5014",
        href: "https://partymall.ua/item-b",
        title: "Second",
        imageSrc: "https://partymall.ua/img/b.webp",
      },
    });

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_WITH_OCF) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getPartymallGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(fetchPageHtml).toHaveBeenCalledWith(GROUP_URL, { konkName: "partymall" });
    expect(fetchPageHtml).toHaveBeenCalledWith(PAGE2_WITH_OCF, { konkName: "partymall" });
    expect(getGroupPagesThrottleDelayMs).toHaveBeenCalledWith("partymall");
    expect(result).toEqual([
      {
        productId: "1064",
        title: "First & one",
        url: "https://partymall.ua/item-a",
        imageUrl: "https://partymall.ua/img/a.webp",
      },
      {
        productId: "5014",
        title: "Second",
        url: "https://partymall.ua/item-b",
        imageUrl: "https://partymall.ua/img/b.webp",
      },
    ]);
  });

  it("stops on empty 404 page", async () => {
    const html1 = pageHtml({
      product: {
        productId: "1",
        href: "/a",
        title: "A",
        imageSrc: "https://partymall.ua/a.webp",
      },
      nextHref: PAGE2_NO_OCF,
    });
    const html404 = `<!DOCTYPE html><html><body><div class="error-404-wrapper">404</div>
      <div class="ds-module-item" data-pid="999"><a class="ds-module-title" href="/x">Sidebar</a></div>
    </body></html>`;

    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_WITH_OCF) return html404;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getPartymallGroupPagesProducts({ groupUrl: GROUP_URL });
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("1");
  });
});
