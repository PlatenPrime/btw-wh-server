import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { getPartymallNextPageUrl } from "../getPartymallNextPageUrl.js";

const GROUP_URL =
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?ocf=F31S2V3127113339";
const PAGE2 =
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?page=2";

describe("getPartymallNextPageUrl", () => {
  it("reads link rel=next", () => {
    const $ = cheerio.load(
      `<!DOCTYPE html><html><head><link rel="next" href="${PAGE2}" /></head><body></body></html>`,
    );
    expect(getPartymallNextPageUrl($, GROUP_URL)).toBe(PAGE2);
  });

  it("returns null without rel=next", () => {
    const $ = cheerio.load("<!DOCTYPE html><html><head></head><body></body></html>");
    expect(getPartymallNextPageUrl($, GROUP_URL)).toBeNull();
  });

  it("returns null on 404 page even with sidebar links", () => {
    const $ = cheerio.load(`<!DOCTYPE html><html><head>
      <link rel="next" href="${PAGE2}" />
    </head><body><div class="error-404-wrapper">404</div></body></html>`);
    expect(getPartymallNextPageUrl($, GROUP_URL)).toBeNull();
  });
});
