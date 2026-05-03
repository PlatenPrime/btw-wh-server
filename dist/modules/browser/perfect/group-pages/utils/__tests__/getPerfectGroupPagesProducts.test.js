import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerfectGroupPagesProducts } from "../getPerfectGroupPagesProducts.js";
import { browserGet } from "../../../../utils/browserRequest.js";
vi.mock("../../../../utils/browserRequest.js");
vi.mock("../../../../utils/sleep.js", () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../../../group-pages/config/groupPagesThrottle.js", () => ({
    getGroupPagesThrottleDelayMs: vi.fn(() => 0),
}));
const GROUP_URL = "https://perfectparty.example.test/20-category";
const PAGE2_URL = "https://perfectparty.example.test/20-category?page=2";
function miniatureCard(opts) {
    return `<article class="product-miniature js-product-miniature" data-id-product="${opts.productIdInSlug.split("-")[0] ?? "1"}" data-id-product-attribute="0">
  <div class="thumbnail-container"><div class="thumbnail-top">
    <a href="${opts.productPath}" class="thumbnail product-thumbnail">
      <img alt="${opts.title}" title="${opts.title}" data-full-size-image-url="${opts.imagePath}" src="data:image/png;base64,xx" width="250" height="250" />
    </a>
  </div></div>
</article>`;
}
function pageHtml(opts) {
    const next = opts.nextHref != null
        ? `<link rel="next" href="${opts.nextHref}" />`
        : "";
    return `<!DOCTYPE html><html><head>${next}</head><body>
<div class="products row">${miniatureCard(opts)}</div>
</body></html>`;
}
describe("getPerfectGroupPagesProducts", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    it("parses products across two pages", async () => {
        const html1 = pageHtml({
            productPath: "/cat/11253-3455-product-slug.html",
            productIdInSlug: "11253-3455",
            title: "Ball &amp; one",
            imagePath: "https://perfectparty.example.test/img/a.jpg",
            nextHref: PAGE2_URL,
        });
        const html2 = pageHtml({
            productPath: "/cat/16067-other-slug.html",
            productIdInSlug: "16067",
            title: "Pack fifty",
            imagePath: "https://perfectparty.example.test/img/b.jpg",
        });
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === GROUP_URL)
                return html1;
            if (url === PAGE2_URL)
                return html2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getPerfectGroupPagesProducts({
            groupUrl: GROUP_URL,
            maxPages: 2,
        });
        expect(result).toHaveLength(2);
        const p1 = result.find((p) => p.productId === "11253");
        expect(p1?.url).toBe("https://perfectparty.example.test/cat/11253-3455-product-slug.html");
        expect(p1?.title).not.toContain("&amp;");
        expect(p1?.title).toContain("&");
        const p2 = result.find((p) => p.productId === "16067");
        expect(p2?.url).toBe("https://perfectparty.example.test/cat/16067-other-slug.html");
    });
    it("preserves groupUrl query on paginated next URL (rel=next without query)", async () => {
        const groupWithQuery = "https://perfectparty.example.test/20-lateksni-kulki?virobniki=sempertex-kolumbiya";
        const page2NoQuery = "https://perfectparty.example.test/20-lateksni-kulki?page=2";
        const page2WithQuery = "https://perfectparty.example.test/20-lateksni-kulki?page=2&virobniki=sempertex-kolumbiya";
        const html1 = pageHtml({
            productPath: "/k/111-222-a.html",
            productIdInSlug: "111-222",
            title: "One",
            imagePath: "https://perfectparty.example.test/1.jpg",
            nextHref: page2NoQuery,
        });
        const html2 = pageHtml({
            productPath: "/k/333-b.html",
            productIdInSlug: "333",
            title: "Two",
            imagePath: "https://perfectparty.example.test/2.jpg",
        });
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === groupWithQuery)
                return html1;
            if (url === page2WithQuery)
                return html2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const result = await getPerfectGroupPagesProducts({
            groupUrl: groupWithQuery,
            maxPages: 2,
        });
        expect(result).toHaveLength(2);
        const calls = vi.mocked(browserGet).mock.calls.map((c) => c[0]);
        expect(calls[0]).toBe(groupWithQuery);
        expect(calls[1]).toBe(page2WithQuery);
    });
});
