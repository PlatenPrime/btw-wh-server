import { toSliceDate } from "../../../utils/sliceDate.js";
import { Konk } from "../../konks/models/Konk.js";
import { Sku } from "../../skus/models/Sku.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import { SkuManufacturerDaySales } from "../models/SkuManufacturerDaySales.js";
import {
  sliceDateMinusDays,
  sliceDatePlusDays,
} from "./coalesceSkuSliceItemsForReporting.js";
import { computePersistedDaySales } from "./persistedSliceSalesUtils.js";

export { sliceDatePlusDays };

export type MaterializeSkuSliceSalesResult = {
  konkName: string;
  daysTouched: string[];
  /** Число productId, по которым посчитаны sales (до группировки в rollup). */
  keysUpdated: number;
  /** Число upsert-документов rollup (prodName buckets). */
  rollupDocs: number;
  apply: boolean;
};

type ProductSales = {
  productId: string;
  salesPcs: number;
  salesUah: number;
};

async function loadRecountDays(konkName: string): Promise<Set<string>> {
  const doc = await Konk.findOne({ name: konkName }).select("recountDays").lean();
  return new Set((doc?.recountDays ?? []).map(String));
}

async function loadProdNameByProductId(
  konkName: string,
): Promise<Map<string, string>> {
  const docs = await Sku.find({ konkName })
    .select("productId prodName")
    .lean<{ productId: string; prodName: string }[]>();
  const map = new Map<string, string>();
  for (const doc of docs) {
    const productId = (doc.productId ?? "").trim();
    const prodName = (doc.prodName ?? "").trim();
    if (!productId || !prodName) continue;
    map.set(productId, prodName);
  }
  return map;
}

function computeProductSalesForDay(params: {
  day: Date;
  prevData: Record<string, { stock?: number; price?: number }> | null | undefined;
  currData: Record<string, { stock?: number; price?: number }>;
  productIds: string[] | undefined;
  recountDays: Set<string>;
}): ProductSales[] {
  const { day, prevData, currData, productIds, recountDays } = params;
  const keys = productIds?.length
    ? productIds.filter((id) => Object.prototype.hasOwnProperty.call(currData, id))
    : Object.keys(currData);

  const out: ProductSales[] = [];
  for (const productId of keys) {
    const curr = currData[productId];
    if (!curr) continue;
    const prev = prevData?.[productId];
    const sales = computePersistedDaySales({
      prevStockRaw: prev?.stock,
      currStockRaw: curr.stock,
      currPriceRaw: curr.price,
      date: day,
      recountDays,
    });
    out.push({
      productId,
      salesPcs: sales.salesPcs,
      salesUah: sales.salesUah,
    });
  }
  return out;
}

/**
 * Полный replace rollup за (konk, date): считает sales по всем ключам data,
 * группирует по Sku.prodName. Partial productIds не используются — идемпотентный день.
 */
async function replaceManufacturerDayRollup(params: {
  konkName: string;
  day: Date;
  prevData: Record<string, { stock?: number; price?: number }> | null | undefined;
  currData: Record<string, { stock?: number; price?: number }>;
  recountDays: Set<string>;
  prodNameByProductId: Map<string, string>;
  apply: boolean;
}): Promise<{ keysUpdated: number; rollupDocs: number }> {
  const {
    konkName,
    day,
    prevData,
    currData,
    recountDays,
    prodNameByProductId,
    apply,
  } = params;

  const productSales = computeProductSalesForDay({
    day,
    prevData,
    currData,
    productIds: undefined,
    recountDays,
  });

  const buckets = new Map<string, { salesPcs: number; salesUah: number }>();
  for (const row of productSales) {
    const prodName = prodNameByProductId.get(row.productId);
    if (!prodName) continue;
    const cur = buckets.get(prodName) ?? { salesPcs: 0, salesUah: 0 };
    cur.salesPcs += row.salesPcs;
    cur.salesUah += row.salesUah;
    buckets.set(prodName, cur);
  }

  if (!apply) {
    return { keysUpdated: productSales.length, rollupDocs: buckets.size };
  }

  await SkuManufacturerDaySales.deleteMany({ konkName, date: day });
  if (buckets.size > 0) {
    await SkuManufacturerDaySales.insertMany(
      [...buckets.entries()].map(([prodName, totals]) => ({
        konkName,
        date: day,
        prodName,
        salesPcs: totals.salesPcs,
        salesUah: Math.round(totals.salesUah * 100) / 100,
      })),
    );
  }

  return { keysUpdated: productSales.length, rollupDocs: buckets.size };
}

/**
 * Materialize sales → SkuManufacturerDaySales за D и D+1 (каскад).
 * В Mixed SkuSlice.data ничего не пишет.
 */
export async function materializeSkuSliceSalesForKonkDays(params: {
  konkName: string;
  dayD: Date;
  /** @deprecated ignored — rollup всегда полный день */
  productIds?: string[];
  apply?: boolean;
}): Promise<MaterializeSkuSliceSalesResult> {
  const konkName = params.konkName;
  const dayD = toSliceDate(params.dayD);
  const dayNext = sliceDatePlusDays(dayD, 1);
  const dayPrev = sliceDateMinusDays(dayD, 1);
  const apply = params.apply !== false;

  const [recountDays, prodNameByProductId] = await Promise.all([
    loadRecountDays(konkName),
    loadProdNameByProductId(konkName),
  ]);

  const docs = await SkuSlice.find({
    konkName,
    date: { $in: [dayPrev, dayD, dayNext] },
  })
    .select("date data")
    .lean();

  const byTime = new Map<number, (typeof docs)[number]>();
  for (const doc of docs) {
    byTime.set(toSliceDate(doc.date).getTime(), doc);
  }

  const prevDoc = byTime.get(dayPrev.getTime());
  const dDoc = byTime.get(dayD.getTime());
  const nextDoc = byTime.get(dayNext.getTime());

  let keysUpdated = 0;
  let rollupDocs = 0;
  const daysTouched: string[] = [];

  if (dDoc?.data) {
    const r = await replaceManufacturerDayRollup({
      konkName,
      day: dayD,
      prevData: prevDoc?.data as Record<string, { stock?: number; price?: number }>,
      currData: dDoc.data as Record<string, { stock?: number; price?: number }>,
      recountDays,
      prodNameByProductId,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayD.toISOString().slice(0, 10));
  }

  if (nextDoc?.data) {
    const r = await replaceManufacturerDayRollup({
      konkName,
      day: dayNext,
      prevData: dDoc?.data as Record<string, { stock?: number; price?: number }>,
      currData: nextDoc.data as Record<string, { stock?: number; price?: number }>,
      recountDays,
      prodNameByProductId,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayNext.toISOString().slice(0, 10));
  }

  return { konkName, daysTouched, keysUpdated, rollupDocs, apply };
}

/**
 * Хук после мутации stock/price: пересчёт manufacturer rollup за D и D+1.
 */
export async function afterSkuSliceStockMutation(params: {
  konkName: string;
  dayD: Date;
  productIds?: string[];
}): Promise<MaterializeSkuSliceSalesResult> {
  return materializeSkuSliceSalesForKonkDays({
    ...params,
    apply: true,
  });
}

/**
 * Backfill rollup по диапазону: для каждого дня полный replace buckets.
 */
export async function materializeSkuSliceSalesDateRange(params: {
  konkName: string;
  fromDate: Date;
  toDate: Date;
  productIds?: string[];
  apply?: boolean;
  onProgress?: (info: {
    konkName: string;
    day: string;
    dayIndex: number;
    dayTotal: number;
    keysUpdated: number;
    rollupDocs: number;
  }) => void;
}): Promise<MaterializeSkuSliceSalesResult> {
  const from = toSliceDate(params.fromDate);
  const to = toSliceDate(params.toDate);
  const apply = params.apply !== false;
  const [recountDays, prodNameByProductId] = await Promise.all([
    loadRecountDays(params.konkName),
    loadProdNameByProductId(params.konkName),
  ]);
  let keysUpdated = 0;
  let rollupDocs = 0;
  const daysTouched: string[] = [];

  const dayTotal =
    Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  let dayIndex = 0;

  for (
    let d = new Date(from);
    d.getTime() <= to.getTime();
    d = sliceDatePlusDays(d, 1)
  ) {
    dayIndex += 1;
    const dayPrev = sliceDateMinusDays(d, 1);
    const dayKey = d.toISOString().slice(0, 10);
    const docs = await SkuSlice.find({
      konkName: params.konkName,
      date: { $in: [dayPrev, d] },
    })
      .select("date data")
      .lean();
    const byTime = new Map(
      docs.map((doc) => [toSliceDate(doc.date).getTime(), doc]),
    );
    const prevDoc = byTime.get(dayPrev.getTime());
    const dDoc = byTime.get(d.getTime());
    if (!dDoc?.data) {
      params.onProgress?.({
        konkName: params.konkName,
        day: dayKey,
        dayIndex,
        dayTotal,
        keysUpdated,
        rollupDocs,
      });
      continue;
    }

    const r = await replaceManufacturerDayRollup({
      konkName: params.konkName,
      day: d,
      prevData: prevDoc?.data as Record<string, { stock?: number; price?: number }>,
      currData: dDoc.data as Record<string, { stock?: number; price?: number }>,
      recountDays,
      prodNameByProductId,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayKey);
    params.onProgress?.({
      konkName: params.konkName,
      day: dayKey,
      dayIndex,
      dayTotal,
      keysUpdated,
      rollupDocs,
    });
  }

  return {
    konkName: params.konkName,
    daysTouched,
    keysUpdated,
    rollupDocs,
    apply,
  };
}
