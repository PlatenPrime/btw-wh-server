import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYuminGroupPagesProducts } from "../getYuminGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js");

const GROUP_URL =
  "https://yumi.market/api/products?category_id=769&proizvoditel=425";
const GROUP_URL_WITH_PAGE =
  "https://yumi.market/api/products?category_id=769&proizvoditel=425&page=3";
const PAGE2_URL =
  "https://yumi.market/api/products?category_id=769&proizvoditel=425&page=2";

function apiProduct(
  id: number,
  name: string,
  urlKey: string,
  image = "https://yumi.market/cache/large/p.webp"
) {
  return {
    id,
    name,
    url_key: urlKey,
    base_image: { large_image_url: image },
  };
}

function jsonPage(
  items: ReturnType<typeof apiProduct>[],
  next: string | null
) {
  return JSON.stringify({
    data: items,
    links: { next },
  });
}

describe("getYuminGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  it("parses products across two pages via links.next", async () => {
    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) {
        return jsonPage(
          [apiProduct(111, "First  item", "first-slug")],
          PAGE2_URL
        );
      }
      if (url === PAGE2_URL) {
        return jsonPage([apiProduct(222, "Second", "second-slug")], null);
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getYuminGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 10,
    });

    expect(result).toHaveLength(2);
    const p1 = result.find((p) => p.productId === "111");
    expect(p1?.title).toBe("First item");
    expect(p1?.url).toBe("https://yumi.market/first-slug");
    const p2 = result.find((p) => p.productId === "222");
    expect(p2?.url).toBe("https://yumi.market/second-slug");
  });

  it("stops when links.next is null on first page", async () => {
    vi.mocked(browserGet).mockResolvedValue(
      jsonPage([apiProduct(1, "Solo", "solo-key")], null)
    );

    const result = await getYuminGroupPagesProducts({ groupUrl: GROUP_URL });

    expect(result).toHaveLength(1);
    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(1);
  });

  it("normalizes groupUrl by removing page param for first request", async () => {
    const normalized =
      "https://yumi.market/api/products?category_id=769&proizvoditel=425";

    vi.mocked(browserGet).mockResolvedValue(
      jsonPage([apiProduct(1, "A", "a")], null)
    );

    await getYuminGroupPagesProducts({ groupUrl: GROUP_URL_WITH_PAGE });

    expect(vi.mocked(browserGet).mock.calls[0]![0]).toBe(normalized);
  });

  it("stops on empty data even if invoked as page 2", async () => {
    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) {
        return jsonPage([apiProduct(1, "Only", "only")], PAGE2_URL);
      }
      if (url === PAGE2_URL) {
        return jsonPage([], null);
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getYuminGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.productId).toBe("1");
  });

  it("stops on pagination loop (visited)", async () => {
    const urlB =
      "https://yumi.market/api/products?category_id=769&proizvoditel=425&page=99";

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) {
        return jsonPage([apiProduct(819, "Loop A", "loop-a")], urlB);
      }
      if (url === urlB) {
        return jsonPage([apiProduct(820, "Loop B", "loop-b")], GROUP_URL);
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getYuminGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 10,
    });

    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
    expect(result.map((p) => p.productId).sort()).toEqual(["819", "820"]);
  });

  it("respects maxPages", async () => {
    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (!url.includes("page=2")) {
        return jsonPage([apiProduct(1, "P1", "p1")], PAGE2_URL);
      }
      return jsonPage([apiProduct(2, "P2", "p2")], null);
    });

    const result = await getYuminGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]!.productId).toBe("1");
  });

  it("uses original_image_url when large is missing", async () => {
    vi.mocked(browserGet).mockResolvedValue(
      JSON.stringify({
        data: [
          {
            id: 5,
            name: "Img",
            url_key: "img-k",
            base_image: { original_image_url: "https://yumi.market/o.webp" },
          },
        ],
        links: { next: null },
      })
    );

    const result = await getYuminGroupPagesProducts({ groupUrl: GROUP_URL });

    expect(result[0]!.imageUrl).toBe("https://yumi.market/o.webp");
  });
});
