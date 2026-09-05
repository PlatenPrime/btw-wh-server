import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";
import { AIR_CLIENT_SKUGR_KONK } from "../../../constants/airClientSkugrFill.js";
import { Skugr } from "../../../models/Skugr.js";
import { fillSkugrSkusFromProductsUtil } from "../../../utils/fillSkugrSkusFromProductsUtil.js";
import type { FillSkugrSkusFromBrowserStats } from "../../../utils/fillSkugrSkusFromProductsUtil.js";
import {
  isAirListingPageOfGroup,
  sourceUrlMatchesSkugrUrl,
} from "../../../utils/isAirListingPageOfGroup.js";
import type { PostAirClientFillPageInput } from "../schemas/postAirClientFillPageSchema.js";

export type PostAirClientFillPageResult =
  | {
      ok: true;
      stats: FillSkugrSkusFromBrowserStats;
      nextPageUrl: string | null;
      productsOnPage: number;
    }
  | {
      ok: false;
      code:
        | "SKUGR_NOT_FOUND"
        | "NOT_AIR"
        | "URL_MISMATCH"
        | "PAGE_URL_MISMATCH"
        | "PARSE_FAILED";
      message: string;
    };

function resolveNextPageUrl(
  productsLength: number,
  nextPageUrl: string | null,
  skugrUrl: string
): string | null {
  if (productsLength === 0 || nextPageUrl == null) {
    return null;
  }
  if (!isAirListingPageOfGroup(nextPageUrl, skugrUrl)) {
    return null;
  }
  return nextPageUrl;
}

/**
 * Принимает карточки одной страницы Air-листинга с клиента и аддитивно заполняет группу.
 */
export async function postAirClientFillPageUtil(
  input: PostAirClientFillPageInput
): Promise<PostAirClientFillPageResult> {
  const skugr = await Skugr.findById(input.id).exec();
  if (!skugr) {
    return {
      ok: false,
      code: "SKUGR_NOT_FOUND",
      message: "Skugr not found",
    };
  }

  if (normalizeCompetitorName(skugr.konkName) !== AIR_CLIENT_SKUGR_KONK) {
    return {
      ok: false,
      code: "NOT_AIR",
      message: "Skugr competitor is not air",
    };
  }

  if (!sourceUrlMatchesSkugrUrl(input.sourceUrl, skugr.url)) {
    return {
      ok: false,
      code: "URL_MISMATCH",
      message: "sourceUrl does not match Skugr.url",
    };
  }

  if (!isAirListingPageOfGroup(input.pageUrl, skugr.url)) {
    return {
      ok: false,
      code: "PAGE_URL_MISMATCH",
      message: "pageUrl is not a listing page of this Air group",
    };
  }

  if (input.products.length === 0 && !input.hasListingMarkup) {
    return {
      ok: false,
      code: "PARSE_FAILED",
      message: "Payload did not contain an Air listing",
    };
  }

  const fillResult = await fillSkugrSkusFromProductsUtil(
    skugr,
    input.products
  );
  if (!fillResult) {
    return {
      ok: false,
      code: "SKUGR_NOT_FOUND",
      message: "Skugr not found",
    };
  }

  return {
    ok: true,
    stats: fillResult.stats,
    nextPageUrl: resolveNextPageUrl(
      input.products.length,
      input.nextPageUrl,
      skugr.url
    ),
    productsOnPage: input.products.length,
  };
}
