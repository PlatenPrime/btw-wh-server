import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYumiGroupPagesProducts } from "../getYumiGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";
vi.mock("../../../../utils/browserRequest.js");
function splitDump(dump) {
    const normalized = dump.replace(/\r\n/g, "\n");
    const firstNewline = normalized.indexOf("\n");
    if (firstNewline === -1) {
        return { dumpUrl: normalized.trim(), html: "" };
    }
    const dumpUrl = normalized.slice(0, firstNewline).trim();
    const html = normalized.slice(firstNewline + 1);
    return { dumpUrl, html };
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const page1Dump = readFileSync(path.join(__dirname, "../../page_1.txt"), "utf-8");
const page2Dump = readFileSync(path.join(__dirname, "../../page_2.txt"), "utf-8");
const page1 = splitDump(page1Dump);
const page2 = splitDump(page2Dump);
describe("getYumiGroupPagesProducts", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    it("should parse products from page_1 and page_2", async () => {
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === page1.dumpUrl)
                return page1.html;
            if (url === page2.dumpUrl)
                return page2.html;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getYumiGroupPagesProducts({
            groupUrl: page1.dumpUrl,
            maxPages: 2,
        });
        expect(result.length).toBeGreaterThan(0);
        const product = result.find((p) => p.productId === "928707587");
        expect(product).toBeDefined();
        expect(product?.url).toBe("https://yumi-market.com.ua/ua/p928707587-gemar-dzh-g90.html");
        expect(product?.imageUrl).toMatch(/^https:\/\/images\.prom\.ua\//);
        expect(product?.title).not.toContain("&#");
        expect(product?.title).toContain('10"');
    });
    it("should stop on pagination loop (visited set)", async () => {
        vi.mocked(browserGet).mockImplementation(async () => page1.html);
        const result = await getYumiGroupPagesProducts({
            groupUrl: page1.dumpUrl,
            maxPages: 10,
        });
        expect(vi.mocked(browserGet)).toHaveBeenCalledTimes(2);
        const calls = vi.mocked(browserGet).mock.calls.map((c) => c[0]);
        expect(calls).toContain(page1.dumpUrl);
        expect(calls).toContain(page2.dumpUrl);
        // Так как page_2 вернул page_1 HTML, товара с page_2 быть не должно.
        expect(result.some((p) => p.productId === "928707587")).toBe(false);
        expect(result.some((p) => p.productId === "819105543")).toBe(true);
    });
});
