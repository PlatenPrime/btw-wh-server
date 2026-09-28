import { browserGet } from "../../../utils/browserRequest.js";
import { sleep } from "../../../utils/sleep.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  getYuminGroupPagesProductsSchema,
  type GetYuminGroupPagesProductsInput,
} from "./getYuminGroupPagesProductsSchema.js";
import { buildYuminProductPageUrl } from "./build-yumin-product-page-url/buildYuminProductPageUrl.js";
import { normalizeYuminListingStartUrl } from "./normalize-yumin-listing-start-url/normalizeYuminListingStartUrl.js";
import { pickYuminListingImageUrl } from "./pick-yumin-listing-image-url/pickYuminListingImageUrl.js";
import {
  parseYuminProductsPage,
  yuminProductsPageSchema,
} from "./parse-yumin-products-page/parseYuminProductsPage.js";

export type YuminGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

export async function getYuminGroupPagesProducts(
  input: GetYuminGroupPagesProductsInput
): Promise<YuminGroupPageProduct[]> {
  const parseResult = getYuminGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  const visited = new Set<string>();
  const products = new Map<string, YuminGroupPageProduct>();

  let currentUrl: string | null = normalizeYuminListingStartUrl(groupUrl);
  let fetchedPages = 0;

  while (currentUrl) {
    if (fetchedPages >= maxPages) {
      break;
    }
    if (visited.has(currentUrl)) {
      break;
    }
    visited.add(currentUrl);

    const raw = await browserGet<string>(currentUrl);
    const pageParsed = yuminProductsPageSchema.safeParse(
      parseYuminProductsPage(raw, currentUrl)
    );
    if (!pageParsed.success) {
      throw new Error(pageParsed.error.message);
    }

    const { data, links } = pageParsed.data;

    if (data.length === 0) {
      break;
    }

    for (const item of data) {
      const imageUrl = pickYuminListingImageUrl(item.base_image);
      if (!imageUrl) {
        continue;
      }
      const title = item.name.replace(/\s+/g, " ").trim();
      if (!title) {
        continue;
      }
      const url = buildYuminProductPageUrl(currentUrl, item.url_key);
      const productId = String(item.id);
      products.set(productId, {
        productId,
        title,
        url,
        imageUrl,
      });
    }

    fetchedPages += 1;

    const next = links?.next?.trim() ?? null;
    if (!next || next === currentUrl || visited.has(next)) {
      break;
    }
    await sleep(getGroupPagesThrottleDelayMs());
    currentUrl = next;
  }

  return [...products.values()];
}
