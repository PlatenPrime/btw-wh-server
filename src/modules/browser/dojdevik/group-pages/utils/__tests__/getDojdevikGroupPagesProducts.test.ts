import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDojdevikGroupPagesProducts } from "../getDojdevikGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js");

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../skugr-pages"
);

const GROUP_URL =
  "https://dojdevik.com.ua/ua/g4092193-vozdushnye-shariki-multfilmy";
const PAGE2_URL = `${GROUP_URL}/page_2`;

describe("getDojdevikGroupPagesProducts", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  it("parses products from fixture pages with rel=next pagination", async () => {
    const html1 = readFileSync(join(fixturesDir, "skugr-page-1.txt"), "utf8");
    const html2 = readFileSync(join(fixturesDir, "skugr-page-2.txt"), "utf8");

    vi.mocked(browserGet).mockImplementation(async (url: string) => {
      if (url === GROUP_URL) return html1;
      if (url === PAGE2_URL || url.startsWith(`${PAGE2_URL}?`)) return html2;
      throw new Error(`Unexpected url: ${url}`);
    });

    const result = await getDojdevikGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 2,
    });

    expect(result.length).toBeGreaterThan(20);
    expect(result.every((p) => p.productId && p.url && p.title)).toBe(true);
    expect(result.some((p) => p.url.includes("dojdevik.com.ua") || p.url.startsWith("http"))).toBe(
      true
    );
    expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
  });

  it("includes OOS products from last page via product-block", async () => {
    const htmlLast = readFileSync(
      join(fixturesDir, "skugr-page-last.txt"),
      "utf8"
    );

    vi.mocked(browserGet).mockResolvedValue(htmlLast);

    const result = await getDojdevikGroupPagesProducts({
      groupUrl: GROUP_URL,
      maxPages: 1,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.productId.length > 0)).toBe(true);
  });

  it("throws on invalid input", async () => {
    await expect(
      getDojdevikGroupPagesProducts({ groupUrl: "" } as never)
    ).rejects.toThrow();
  });
});
