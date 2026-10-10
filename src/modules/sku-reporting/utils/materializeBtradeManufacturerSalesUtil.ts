import { toSliceDate } from "../../../utils/sliceDate.js";
import { Art } from "../../arts/models/Art.js";
import { loadDayMap } from "../../btrade-slices/utils/btradeSliceMonthStore.js";
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
 * Читает точки из btrade_slice_months.
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

  const [prevData, dData, nextData] = await Promise.all([
    loadDayMap(dayPrev),
    loadDayMap(dayD),
    loadDayMap(dayNext),
  ]);

  let keysUpdated = 0;
  let rollupDocs = 0;
  const daysTouched: string[] = [];

  if (Object.keys(dData).length > 0) {
    const r = await replaceBtradeManufacturerDayRollup({
      day: dayD,
      prevData,
      currData: dData,
      prodNameByArtikul,
      apply,
    });
    keysUpdated += r.keysUpdated;
    rollupDocs += r.rollupDocs;
    daysTouched.push(dayD.toISOString().slice(0, 10));
  }

  if (Object.keys(nextData).length > 0) {
    const r = await replaceBtradeManufacturerDayRollup({
      day: dayNext,
      prevData: dData,
      currData: nextData,
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
    const [prevData, dData] = await Promise.all([
      loadDayMap(dayPrev),
      loadDayMap(d),
    ]);
    if (Object.keys(dData).length === 0) {
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
      prevData,
      currData: dData,
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
