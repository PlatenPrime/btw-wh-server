import { toSliceDate } from "../../../utils/sliceDate.js";
import { Art } from "../../arts/models/Art.js";
import { BtradeSlice } from "../../btrade-slices/models/BtradeSlice.js";
import { BtradeManufacturerDaySales } from "../models/BtradeManufacturerDaySales.js";
import {
  sliceDateMinusDays,
  sliceDatePlusDays,
} from "./coalesceSkuSliceItemsForReporting.js";
import { computePersistedDaySales } from "./persistedSliceSalesUtils.js";

export type MaterializeBtradeManufacturerSalesResult = {
  daysTouched: string[];
  keysUpdated: number;
  rollupDocs: number;
  apply: boolean;
};

async function loadProdNameByArtikul(): Promise<Map<string, string>> {
  const docs = await Art.find({})
    .select("artikul prodName")
    .lean<{ artikul: string; prodName: string }[]>();
  const map = new Map<string, string>();
  for (const doc of docs) {
    const artikul = (doc.artikul ?? "").trim();
    const prodName = (doc.prodName ?? "").trim().toLowerCase();
    if (!artikul || !prodName) continue;
    if (!map.has(artikul)) map.set(artikul, prodName);
  }
  return map;
}

async function replaceBtradeManufacturerDayRollup(params: {
  day: Date;
  prevData:
    | Record<string, { quantity?: number; price?: number }>
    | null
    | undefined;
  currData: Record<string, { quantity?: number; price?: number }>;
  prodNameByArtikul: Map<string, string>;
  apply: boolean;
}): Promise<{ keysUpdated: number; rollupDocs: number }> {
  const { day, prevData, currData, prodNameByArtikul, apply } = params;

  const buckets = new Map<string, { salesPcs: number; salesUah: number }>();
  let keysUpdated = 0;

  for (const artikul of Object.keys(currData)) {
    const curr = currData[artikul];
    if (!curr) continue;
    const prodName = prodNameByArtikul.get(artikul);
    if (!prodName) continue;
    const prev = prevData?.[artikul];
    const sales = computePersistedDaySales({
      prevStockRaw: prev?.quantity,
      currStockRaw: curr.quantity,
      currPriceRaw: curr.price,
      date: day,
    });
    keysUpdated += 1;
    const cur = buckets.get(prodName) ?? { salesPcs: 0, salesUah: 0 };
    cur.salesPcs += sales.salesPcs;
    cur.salesUah += sales.salesUah;
    buckets.set(prodName, cur);
  }

  if (!apply) {
    return { keysUpdated, rollupDocs: buckets.size };
  }

  await BtradeManufacturerDaySales.deleteMany({ date: day });
  if (buckets.size > 0) {
    await BtradeManufacturerDaySales.insertMany(
      [...buckets.entries()].map(([prodName, totals]) => ({
        date: day,
        prodName,
        salesPcs: totals.salesPcs,
        salesUah: Math.round(totals.salesUah * 100) / 100,
      })),
    );
  }

  return { keysUpdated, rollupDocs: buckets.size };
}

/**
 * Materialize Btrade sales → BtradeManufacturerDaySales за D и D+1.
 * В Mixed BtradeSlice.data ничего не пишет.
 */
export async function materializeBtradeManufacturerSalesForDays(params: {
  dayD: Date;
  apply?: boolean;
}): Promise<MaterializeBtradeManufacturerSalesResult> {
  const dayD = toSliceDate(params.dayD);
  const dayNext = sliceDatePlusDays(dayD, 1);
  const dayPrev = sliceDateMinusDays(dayD, 1);
  const apply = params.apply !== false;

  const prodNameByArtikul = await loadProdNameByArtikul();

  const docs = await BtradeSlice.find({
    date: { $in: [dayPrev, dayD, dayNext] },
  })
    .select("date data")
    .lean();

  const byTime = new Map(
    docs.map((doc) => [toSliceDate(doc.date).getTime(), doc]),
  );
  const prevDoc = byTime.get(dayPrev.getTime());
  const dDoc = byTime.get(dayD.getTime());
  const nextDoc = byTime.get(dayNext.getTime());

  let keysUpdated = 0;
  let rollupDocs = 0;
  const daysTouched: string[] = [];

  if (dDoc?.data) {
    const r = await replaceBtradeManufacturerDayRollup({
      day: dayD,
      prevData: prevDoc?.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      currData: dDoc.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      prodNameByArtikul,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayD.toISOString().slice(0, 10));
  }

  if (nextDoc?.data) {
    const r = await replaceBtradeManufacturerDayRollup({
      day: dayNext,
      prevData: dDoc?.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      currData: nextDoc.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      prodNameByArtikul,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayNext.toISOString().slice(0, 10));
  }

  return { daysTouched, keysUpdated, rollupDocs, apply };
}

export async function afterBtradeSliceStockMutation(params: {
  dayD: Date;
}): Promise<MaterializeBtradeManufacturerSalesResult> {
  return materializeBtradeManufacturerSalesForDays({
    ...params,
    apply: true,
  });
}

/**
 * Backfill Btrade manufacturer rollup по диапазону (ascending, только день D за шаг).
 */
export async function materializeBtradeManufacturerSalesDateRange(params: {
  fromDate: Date;
  toDate: Date;
  apply?: boolean;
  onProgress?: (info: {
    day: string;
    dayIndex: number;
    dayTotal: number;
    keysUpdated: number;
    rollupDocs: number;
  }) => void;
}): Promise<MaterializeBtradeManufacturerSalesResult> {
  const from = toSliceDate(params.fromDate);
  const to = toSliceDate(params.toDate);
  const apply = params.apply !== false;
  const prodNameByArtikul = await loadProdNameByArtikul();

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
    const docs = await BtradeSlice.find({
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
        day: dayKey,
        dayIndex,
        dayTotal,
        keysUpdated,
        rollupDocs,
      });
      continue;
    }

    const r = await replaceBtradeManufacturerDayRollup({
      day: d,
      prevData: prevDoc?.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      currData: dDoc.data as Record<
        string,
        { quantity?: number; price?: number }
      >,
      prodNameByArtikul,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayKey);
    params.onProgress?.({
      day: dayKey,
      dayIndex,
      dayTotal,
      keysUpdated,
      rollupDocs,
    });
  }

  return { daysTouched, keysUpdated, rollupDocs, apply };
}
