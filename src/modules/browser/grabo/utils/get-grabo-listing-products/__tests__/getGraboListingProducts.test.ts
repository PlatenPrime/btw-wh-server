import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { sleep } from "../../../../utils/sleep.js";
import { GRABO_BASE_URL } from "../../types/graboSkuData.js";
import { getGraboListingProducts } from "../getGraboListingProducts.js";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../../../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));
vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../utils/sleep.js", () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(
  __dirname,
  "../../get-grabo-sku-data/__tests__/fixtures"
);

const page1Html = readFileSync(join(fixturesDir, "products-page-1.txt"), "utf-8");
const page2Html = readFileSync(join(fixturesDir, "product-page-2.txt"), "utf-8");
const page17Html = readFileSync(
  join(fixturesDir, "product-page-17-last.txt"),
  "utf-8"
);

const PAGE1 = `${GRABO_BASE_URL}/en/non-message`;
const PAGE2 = `${GRABO_BASE_URL}/en/non-message/page-2`;
const PAGE16 = `${GRABO_BASE_URL}/en/non-message/page-16`;
const PAGE17 = `${GRABO_BASE_URL}/en/non-message/page-17`;

describe("getGraboListingProducts", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(sleep).mockClear();
    mockLogger.info.mockClear();
  });

  it("throws on invalid groupUrl", async () => {
    await expect(
      getGraboListingProducts({ groupUrl: "nope" })
    ).rejects.toThrow();
  });

  it("follows rel=next and does not treat rel=last page-16 as the end", async () => {
    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === PAGE1) return page1Html;
      if (url === PAGE2) return page2Html;
      throw new Error(`Unexpected url: ${url}`);
    });

    const urls = await getGraboListingProducts(
      { groupUrl: PAGE1, maxPages: 2 },
      { delayBeforeNextMs: 10 }
    );

    expect(fetchPageHtml).toHaveBeenCalledWith(PAGE1, { konkName: "grabo" });
    expect(fetchPageHtml).toHaveBeenCalledWith(PAGE2, { konkName: "grabo" });
    expect(vi.mocked(fetchPageHtml).mock.calls.map(([url]) => url)).not.toContain(
      PAGE16
    );
    expect(urls).toContain(
      `${GRABO_BASE_URL}/en/19514-balloon-multicolor-bow-mini-multicolor`
    );
    expect(urls).toHaveLength(48);
    expect(sleep).toHaveBeenCalledWith(10);
    expect(mockLogger.info).toHaveBeenCalledWith(
      { groupUrl: PAGE1, page: 1, url: PAGE1 },
      "grabo listing page fetch"
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      { groupUrl: PAGE1, page: 2, url: PAGE2 },
      "grabo listing page fetch"
    );
  });

  it("stops on last page without rel=next", async () => {
    vi.mocked(fetchPageHtml).mockResolvedValue(page17Html);

    const urls = await getGraboListingProducts({
      groupUrl: PAGE17,
      maxPages: 10,
    });

    expect(urls).toEqual([
      `${GRABO_BASE_URL}/en/g72272-balloon-pink-ribbon-pink`,
    ]);
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
  });

  it("retries timed-out listing page in place and keeps urls from previous pages", async () => {
    const timeout = new Error(
      "Browser GET failed (ETIMEDOUT): https://www.grabo-balloons.com/en/non-message/page-2 — connect ETIMEDOUT 77.89.18.150:443"
    );
    let page2Attempts = 0;
    vi.mocked(fetchPageHtml).mockImplementation(async (url: string) => {
      if (url === PAGE1) return page1Html;
      if (url === PAGE2) {
        page2Attempts += 1;
        if (page2Attempts === 1) {
          throw timeout;
        }
        return page2Html;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const urls = await getGraboListingProducts(
      { groupUrl: PAGE1, maxPages: 2 },
      { delayBeforeNextMs: 0 }
    );

    expect(urls).toHaveLength(48);
    expect(urls).toContain(
      `${GRABO_BASE_URL}/en/19514-balloon-multicolor-bow-mini-multicolor`
    );
    expect(vi.mocked(fetchPageHtml).mock.calls.map(([url]) => url)).not.toContain(
      PAGE16
    );
    expect(sleep).toHaveBeenCalledWith(8_000);
  });

  it("uses injected getHtml instead of fetchPageHtml", async () => {
    const getHtml = vi.fn().mockResolvedValue(page17Html);

    const urls = await getGraboListingProducts(
      { groupUrl: PAGE17, maxPages: 3 },
      { getHtml }
    );

    expect(urls).toEqual([
      `${GRABO_BASE_URL}/en/g72272-balloon-pink-ribbon-pink`,
    ]);
    expect(getHtml).toHaveBeenCalledWith(PAGE17);
    expect(fetchPageHtml).not.toHaveBeenCalled();
  });
});
