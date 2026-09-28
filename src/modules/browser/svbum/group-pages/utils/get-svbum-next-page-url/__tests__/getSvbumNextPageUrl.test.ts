import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { getSvbumNextPageUrl } from "../getSvbumNextPageUrl.js";

const GROUP_URL =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=F2S2V1646816252F6S2V1054752947";
const PAGE2_NO_OCF =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?page=2";
const PAGE3_WITH_OCF =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=F2S2V1646816252F6S2V1054752947&page=3";

function pageHtml(opts: {
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
<div class="row"><div class="col-xs-12 text-center">${forward}</div></div>
</body></html>`;
}

describe("getSvbumNextPageUrl", () => {
  it("prefers link rel=next over pagination Вперед", () => {
    const $ = cheerio.load(
      pageHtml({ nextHref: PAGE2_NO_OCF, forwardHref: PAGE3_WITH_OCF })
    );
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBe(PAGE2_NO_OCF);
  });

  it("falls back to pagination Вперед when rel=next is absent", () => {
    const $ = cheerio.load(pageHtml({ forwardHref: PAGE3_WITH_OCF }));
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBe(PAGE3_WITH_OCF);
  });

  it("returns null on last page without next or Вперед", () => {
    const $ = cheerio.load(pageHtml({}));
    expect(getSvbumNextPageUrl($, GROUP_URL)).toBeNull();
  });
});
