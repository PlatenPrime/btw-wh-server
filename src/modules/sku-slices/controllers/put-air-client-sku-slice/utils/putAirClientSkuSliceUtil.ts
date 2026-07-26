import { readAirProductFromHtml } from "../../../../browser/air/utils/air-product-page-from-html/readAirProductFromHtml.js";
import { isInvalidSliceStockResult } from "../../../../slices/utils/isInvalidSliceStockResult.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { AIR_CLIENT_SLICE_KONK } from "../../../constants/airClientSlice.js";
import { urlsMatchForClientIngest } from "../../../utils/urlsMatchForClientIngest.js";
import type { PutAirClientSkuSliceInput } from "../schemas/putAirClientSkuSliceSchema.js";

export type PutAirClientSkuSliceStatus = "saved" | "skipped";

export type PutAirClientSkuSliceResult =
  | {
      ok: true;
      status: PutAirClientSkuSliceStatus;
      date: Date;
      productId: string;
      stock: number;
      price: number;
    }
  | {
      ok: false;
      code:
        | "SKU_NOT_FOUND"
        | "NOT_AIR"
        | "NOT_SLICED"
        | "URL_MISMATCH"
        | "PARSE_FAILED"
        | "NO_PRODUCT_ID";
      message: string;
    };

/**
 * Парсит HTML Air-страницы и идемпотентно дозаполняет сегодняшний SkuSlice
 * только если ключ отсутствует или содержит -1.
 */
export async function putAirClientSkuSliceUtil(
  input: PutAirClientSkuSliceInput,
  now: Date = new Date()
): Promise<PutAirClientSkuSliceResult> {
  const sku = await Sku.findById(input.skuId)
    .select("konkName productId url")
    .lean();

  if (!sku) {
    return {
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    };
  }

  const konkName = (sku.konkName ?? "").trim().toLowerCase();
  if (konkName !== AIR_CLIENT_SLICE_KONK) {
    return {
      ok: false,
      code: "NOT_AIR",
      message: "Sku competitor is not air",
    };
  }

  const productId = (sku.productId ?? "").trim();
  if (!productId) {
    return {
      ok: false,
      code: "NO_PRODUCT_ID",
      message: "Sku has no productId",
    };
  }

  const inSlicedGroup = await Skugr.exists({
    konkName: AIR_CLIENT_SLICE_KONK,
    isSliced: true,
    skus: sku._id,
  });
  if (!inSlicedGroup) {
    return {
      ok: false,
      code: "NOT_SLICED",
      message: "Sku is not in any sliced Air group",
    };
  }

  if (!urlsMatchForClientIngest(input.sourceUrl, sku.url)) {
    return {
      ok: false,
      code: "URL_MISMATCH",
      message: "sourceUrl does not match Sku.url",
    };
  }

  const parsed = readAirProductFromHtml(input.html);
  if (isInvalidSliceStockResult(parsed)) {
    return {
      ok: false,
      code: "PARSE_FAILED",
      message: "HTML did not contain valid stock/price",
    };
  }

  const sliceDate = toSliceDate(now);
  const dataItem = { stock: parsed.stock, price: parsed.price };

  await SkuSlice.findOneAndUpdate(
    { konkName: AIR_CLIENT_SLICE_KONK, date: sliceDate },
    {
      $setOnInsert: {
        konkName: AIR_CLIENT_SLICE_KONK,
        date: sliceDate,
        data: {},
      },
    },
    { upsert: true }
  );

  const updated = await SkuSlice.findOneAndUpdate(
    {
      konkName: AIR_CLIENT_SLICE_KONK,
      date: sliceDate,
      $or: [
        { [`data.${productId}`]: { $exists: false } },
        { [`data.${productId}.stock`]: -1 },
        { [`data.${productId}.price`]: -1 },
      ],
    },
    { $set: { [`data.${productId}`]: dataItem } },
    { new: true }
  );

  if (!updated) {
    const existing = await SkuSlice.findOne({
      konkName: AIR_CLIENT_SLICE_KONK,
      date: sliceDate,
    })
      .select("data")
      .lean();
    const current = existing?.data?.[productId];
    return {
      ok: true,
      status: "skipped",
      date: sliceDate,
      productId,
      stock: current?.stock ?? dataItem.stock,
      price: current?.price ?? dataItem.price,
    };
  }

  return {
    ok: true,
    status: "saved",
    date: sliceDate,
    productId,
    stock: dataItem.stock,
    price: dataItem.price,
  };
}
