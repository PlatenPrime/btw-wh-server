import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharteGroupPagesProducts } from "../getSharteGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js");

const GROUP_URL = "https://sharte.example.test/catalog/group/apply/";
const PAGE2_URL =
  "https://sharte.example.test/catalog/group/apply/?PAGEN_1=2";

function sharteProductCard(opts: {
  productId: string;
  productPath: string;
  imagePath: string;
  title: string;
}): string {
  return `<div class="item product sku" data-product-id="${opts.productId}">
    <div class="tabloid">
      <a href="${opts.productPath}" class="picture">
        <img src="${opts.imagePath}" alt="${opts.title}" />
      </a>
      <a href="${opts.productPath}" class="name"><span class="middle">${opts.title}</span></a>
    </div>
  </div>`;
}

function shartePagination(opts: { nextHref?: string }): string {
  const nextLi =
    opts.nextHref != null
      ? `<li class="bx-pag-next"><a href="${opts.nextHref}"><span>Вперед</span></a></li>`
      : `<li class="bx-pag-next"><span>Вперед</span></li>`;
  return `<div class="bx-pagination"><div class="bx-pagination-container row"><ul>
    <li class="bx-active"><span>1</span></li>
    ${nextLi}
  </ul></div></div>`;
}

function shartePageHtml(opts: {
  cards: string[];
  nextHref?: string;
}): string {
  const grid = opts.cards.join("");
  const pagination = shartePagination({
    ...(opts.nextHref !== undefined && { nextHref: opts.nextHref }),
  });
  return `<!DOCTYPE html><html><head></head><body>
<div class="items productList">${grid}</div>
${pagination}
</body></html>`;
}

describe("getSharteGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  it("parses products across two pages", async () => {
    const html1 = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "111",
          productPath: "/catalog/p111.html",
          imagePath: "/upload/a.png",
          title: "Balloon &#34;10&quot;",
        }),
      ],
      nextHref: "/catalog/group/apply/?PAGEN_1=2",
    });
    const html2 = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "222",
          productPath: "/catalog/p222.html",
          imagePath: "/upload/b.png",
          title: "Other",
        }),
      ],
    });

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getSharteGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result).toHaveLength(2);
    const p1 = result.find((p) => p.productId === "111");
    expect(p1?.url).toBe("https://sharte.example.test/catalog/p111.html");
    expect(p1?.imageUrl).toBe("https://sharte.example.test/upload/a.png");
    expect(p1?.title).not.toContain("&#");
    expect(p1?.title).toContain("10");
    const p2 = result.find((p) => p.productId === "222");
    expect(p2?.url).toBe("https://sharte.example.test/catalog/p222.html");
  });

  it("stops on last page when bx-pag-next has no link", async () => {
    const html = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "1",
          productPath: "/catalog/x.html",
          imagePath: "/upload/x.png",
          title: "Only",
        }),
      ],
    });

    vi.mocked(browserGet).mockResolvedValue(html);

    const result = await getSharteGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result).toHaveLength(1);
    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(1);
  });

  it("stops when a later page has no product cards", async () => {
    const html1 = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "1",
          productPath: "/catalog/a.html",
          imagePath: "/upload/a.png",
          title: "First",
        }),
      ],
      nextHref: "/catalog/group/apply/?PAGEN_1=2",
    });
    const html2 = shartePageHtml({ cards: [] });

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getSharteGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("1");
    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
  });

  it("uses data-srcset when src is lazy placeholder", async () => {
    const real = "https://sharte.example.test/upload/real.png";
    const html = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "9",
          productPath: "/catalog/z.html",
          imagePath: "/lazy/lazy-image.svg",
          title: "Z",
        }).replace(
          `src="/lazy/lazy-image.svg"`,
          `src="/lazy/lazy-image.svg" data-srcset="${real} 100w"`
        ),
      ],
    });

    vi.mocked(browserGet).mockResolvedValue(html);

    const result = await getSharteGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.imageUrl).toBe(real);
  });

  it("falls back to link rel=next when bx-pag-next has no href", async () => {
    const card = sharteProductCard({
      productId: "1",
      productPath: "/catalog/a.html",
      imagePath: "/upload/a.png",
      title: "A",
    });
    const html1 = `<!DOCTYPE html><html><head><link rel="next" href="${PAGE2_URL}" /></head><body>
<div class="items productList">${card}</div>
<div class="bx-pagination"><ul><li class="bx-pag-next"><span>Вперед</span></li></ul></div>
</body></html>`;
    const html2 = shartePageHtml({
      cards: [
        sharteProductCard({
          productId: "2",
          productPath: "/catalog/b.html",
          imagePath: "/upload/b.png",
          title: "B",
        }),
      ],
    });

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getSharteGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result).toHaveLength(2);
  });
});
