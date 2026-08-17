import { describe, expect, it } from "vitest";
import { GRABO_BASE_URL } from "../../types/graboSkuData.js";
import {
  GRABO_EXTRA_CATEGORY_URLS,
  mergeGraboCategoryUrls,
} from "../graboExtraCategoryUrls.js";

describe("GRABO_EXTRA_CATEGORY_URLS", () => {
  it("lists Maverick tableware listings missing from sitemap", () => {
    expect(GRABO_EXTRA_CATEGORY_URLS).toEqual([
      `${GRABO_BASE_URL}/en/plates`,
      `${GRABO_BASE_URL}/en/napkins`,
      `${GRABO_BASE_URL}/en/banner`,
      `${GRABO_BASE_URL}/en/paper-cups`,
    ]);
  });
});

describe("mergeGraboCategoryUrls", () => {
  const sitemapA = `${GRABO_BASE_URL}/en/party`;
  const sitemapB = `${GRABO_BASE_URL}/en/maverick`;
  const extraA = `${GRABO_BASE_URL}/en/plates`;
  const extraB = `${GRABO_BASE_URL}/en/napkins`;

  it("appends extras that are not in sitemap", () => {
    expect(mergeGraboCategoryUrls([sitemapA, sitemapB], [extraA, extraB])).toEqual(
      [sitemapA, sitemapB, extraA, extraB]
    );
  });

  it("skips extras already present in sitemap", () => {
    expect(
      mergeGraboCategoryUrls([sitemapA, extraA, sitemapB], [extraA, extraB])
    ).toEqual([sitemapA, extraA, sitemapB, extraB]);
  });

  it("returns sitemap urls unchanged when extras are empty", () => {
    expect(mergeGraboCategoryUrls([sitemapA, sitemapB], [])).toEqual([
      sitemapA,
      sitemapB,
    ]);
  });

  it("deduplicates identical sitemap urls before appending extras", () => {
    expect(
      mergeGraboCategoryUrls([sitemapA, sitemapA], [extraA, extraA])
    ).toEqual([sitemapA, extraA]);
  });
});
