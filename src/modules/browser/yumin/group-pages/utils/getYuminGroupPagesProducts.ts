import { z } from "zod";
import { browserGet } from "../../../utils/browserRequest.js";
import { sleep } from "../../../utils/sleep.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  getYuminGroupPagesProductsSchema,
  type GetYuminGroupPagesProductsInput,
} from "./getYuminGroupPagesProductsSchema.js";

const yuminProductsPageSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      url_key: z.string(),
      base_image: z
        .object({
          large_image_url: z.string().optional(),
          original_image_url: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
  ),
  links: z
    .object({
      next: z.string().nullable().optional(),
    })
    .optional(),
});

export type YuminGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function normalizeListingStartUrl(groupUrl: string): string {
  const u = new URL(groupUrl);
  u.searchParams.delete("page");
  return u.toString();
}

function buildProductPageUrl(listingPageUrl: string, urlKey: string): string {
  const origin = new URL(listingPageUrl).origin;
  const path = urlKey.replace(/^\/+/, "");
  return new URL(`/${path}`, origin).toString();
}

function pickImageUrl(
  baseImage: { large_image_url?: string; original_image_url?: string } | null | undefined
): string | null {
  const large = baseImage?.large_image_url?.trim();
  if (large) {
    return large;
  }
  const original = baseImage?.original_image_url?.trim();
  return original || null;
}

function parseYuminProductsPage(raw: string, pageUrl: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON in Yumin listing response: ${pageUrl}`);
  }
}

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

  let currentUrl: string | null = normalizeListingStartUrl(groupUrl);
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
      const imageUrl = pickImageUrl(item.base_image);
      if (!imageUrl) {
        continue;
      }
      const title = item.name.replace(/\s+/g, " ").trim();
      if (!title) {
        continue;
      }
      const url = buildProductPageUrl(currentUrl, item.url_key);
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
