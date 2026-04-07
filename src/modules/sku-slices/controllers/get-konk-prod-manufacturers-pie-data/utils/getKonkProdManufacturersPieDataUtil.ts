import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForProductIdList,
  type SliceAggregateRowSingle,
} from "../../../utils/sliceDataAggregationStages.js";
import { enumerateReportingDates } from "../../../utils/skugrReporting.js";
import type { GetKonkProdManufacturersPieDataInput } from "../schemas/getKonkProdManufacturersPieDataSchema.js";

type ManufacturerPieItem = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

export type GetKonkProdManufacturersPieDataResult =
  | { ok: true; data: Record<string, ManufacturerPieItem> }
  | { ok: false };

type SkuLean = {
  productId: string;
  prodName: string;
};
type ProdLean = {
  name: string;
  title: string;
};

export async function getKonkProdManufacturersPieDataUtil(
  input: GetKonkProdManufacturersPieDataInput,
): Promise<GetKonkProdManufacturersPieDataResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmupStart = sliceDateMinusDays(dateFrom, 1);

  const skuDocs = await Sku.find({ konkName: input.konk })
    .select("productId prodName")
    .lean<SkuLean[]>();

  const productToManufacturer = new Map<string, string>();
  for (const doc of skuDocs) {
    const productId = (doc.productId ?? "").trim();
    const prodName = (doc.prodName ?? "").trim();
    if (!productId || !prodName) continue;
    productToManufacturer.set(productId, prodName);
  }

  const productIds = [...productToManufacturer.keys()];
  if (productIds.length === 0) return { ok: false };
  const manufacturerNames = [...new Set(productToManufacturer.values())];

  const prodDocs = await Prod.find({ name: { $in: manufacturerNames } })
    .select("name title")
    .lean<ProdLean[]>();
  const prodTitleByName = new Map<string, string>();
  for (const prodDoc of prodDocs) {
    const name = (prodDoc.name ?? "").trim();
    const title = (prodDoc.title ?? "").trim();
    if (!name || !title) continue;
    prodTitleByName.set(name, title);
  }

  const sliceRows = await aggregateSkuSlices<SliceAggregateRowSingle>([
    {
      $match: {
        konkName: input.konk,
        date: { $gte: warmupStart, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForProductIdList(productIds),
  ]);

  const datesFull = enumerateReportingDates(warmupStart, dateTo);
  const indexStart = datesFull.findIndex(
    (d) => toSliceDate(d).getTime() >= dateFrom.getTime(),
  );
  if (indexStart < 0 || indexStart >= datesFull.length) return { ok: false };

  const byDate = new Map<number, Record<string, { stock?: unknown; price?: unknown }>>();
  for (const row of sliceRows) {
    const dateKey = toSliceDate(row.date).getTime();
    byDate.set(
      dateKey,
      (row.data ?? {}) as Record<string, { stock?: unknown; price?: unknown }>,
    );
  }

  const result: Record<string, ManufacturerPieItem> = {};

  for (const productId of productIds) {
    const manufacturer = productToManufacturer.get(productId);
    if (!manufacturer) continue;

    const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (date) => {
      const row = byDate.get(toSliceDate(date).getTime());
      const item = row?.[productId];
      return item
        ? ({
            stock:
              typeof item.stock === "number" && Number.isFinite(item.stock)
                ? item.stock
                : -1,
            price:
              typeof item.price === "number" && Number.isFinite(item.price)
                ? item.price
                : -1,
          } as const)
        : null;
    });

    const salesSequence = computeSalesFromStockSequence(
      coalesced.map((item) => item.stock),
    );

    let salesPcs = 0;
    let salesUah = 0;
    for (let i = indexStart; i < datesFull.length; i++) {
      const sales = salesSequence[i]?.sales ?? 0;
      salesPcs += sales;
      salesUah += computeRevenueForDay(sales, coalesced[i]?.price ?? null);
    }

    if (!result[manufacturer]) {
      result[manufacturer] = {
        title: prodTitleByName.get(manufacturer) ?? manufacturer,
        salesPcs: 0,
        salesUah: 0,
      };
    }
    result[manufacturer].salesPcs += salesPcs;
    result[manufacturer].salesUah += salesUah;
  }

  for (const key of Object.keys(result)) {
    const item = result[key]!;
    item.salesUah = Math.round(item.salesUah * 100) / 100;
  }

  if (Object.keys(result).length === 0) return { ok: false };

  return { ok: true, data: result };
}
