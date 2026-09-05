import { fetchGroupProductsByKonkName } from "../../browser/group-products/fetchGroupProductsByKonkName.js";
import { isServerSkugrFillDisabled } from "../config/isServerSkugrFillDisabled.js";
import { Skugr } from "../models/Skugr.js";
import { ServerSkugrFillDisabledError } from "./serverSkugrFillDisabledError.js";
import {
  fillSkugrSkusFromProductsUtil,
  type FillSkugrSkusFromBrowserResult,
} from "./fillSkugrSkusFromProductsUtil.js";

export type {
  FillSkugrSkusFromBrowserResult,
  FillSkugrSkusFromBrowserStats,
} from "./fillSkugrSkusFromProductsUtil.js";

export async function fillSkugrSkusFromBrowserUtil(
  skugrId: string,
  options?: { maxPages?: number },
): Promise<FillSkugrSkusFromBrowserResult | null> {
  const skugr = await Skugr.findById(skugrId).exec();
  if (!skugr) {
    return null;
  }

  if (isServerSkugrFillDisabled(skugr.konkName)) {
    throw new ServerSkugrFillDisabledError(skugr.konkName);
  }

  const products = await fetchGroupProductsByKonkName(skugr.konkName, {
    groupUrl: skugr.url,
    ...(options?.maxPages !== undefined && { maxPages: options.maxPages }),
  });

  return fillSkugrSkusFromProductsUtil(skugr, products);
}
