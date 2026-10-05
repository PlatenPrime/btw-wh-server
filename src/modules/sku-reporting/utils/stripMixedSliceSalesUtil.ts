import { BtradeSlice } from "../../btrade-slices/models/BtradeSlice.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import { toSliceDate } from "../../../utils/sliceDate.js";

export type StripMixedSliceSalesResult = {
  skuDocsScanned: number;
  skuDocsTouched: number;
  btradeDocsScanned: number;
  btradeDocsTouched: number;
  apply: boolean;
};

export type StripMixedSliceSalesProgress = {
  phase: "sku" | "btrade";
  /** После countDocuments, до обхода (scanned=0). */
  event: "phase-start" | "doc";
  scanned: number;
  total: number;
  touched: number;
  konkName?: string;
  day?: string;
};

function stripSalesFieldsFromData(
  data: Record<string, Record<string, unknown>> | null | undefined,
): { next: Record<string, Record<string, unknown>>; changed: boolean } {
  if (!data || typeof data !== "object") {
    return { next: {}, changed: false };
  }
  let changed = false;
  const next: Record<string, Record<string, unknown>> = {};
  for (const [key, item] of Object.entries(data)) {
    if (!item || typeof item !== "object") {
      next[key] = item as Record<string, unknown>;
      continue;
    }
    const { salesPcs: _pcs, salesUah: _uah, ...rest } = item as Record<
      string,
      unknown
    >;
    if ("salesPcs" in item || "salesUah" in item) {
      changed = true;
    }
    next[key] = rest;
  }
  return { next, changed };
}

/**
 * Убирает salesPcs/salesUah из Mixed data SkuSlice/BtradeSlice (откат materialize-in-Mixed).
 * Обход cursor'ом — прогресс идёт по ходу, без ожидания полной выгрузки в память.
 */
export async function stripMixedSliceSalesFields(params: {
  fromDate?: Date;
  toDate?: Date;
  konkName?: string;
  apply?: boolean;
  onProgress?: (info: StripMixedSliceSalesProgress) => void;
}): Promise<StripMixedSliceSalesResult> {
  const apply = params.apply !== false;
  const onProgress = params.onProgress;
  const dateFilter =
    params.fromDate && params.toDate
      ? {
          date: {
            $gte: toSliceDate(params.fromDate),
            $lte: toSliceDate(params.toDate),
          },
        }
      : {};

  const skuFilter = {
    ...dateFilter,
    ...(params.konkName ? { konkName: params.konkName } : {}),
  };

  const skuTotal = await SkuSlice.countDocuments(skuFilter);
  onProgress?.({
    phase: "sku",
    event: "phase-start",
    scanned: 0,
    total: skuTotal,
    touched: 0,
  });

  let skuDocsScanned = 0;
  let skuDocsTouched = 0;
  const skuCursor = SkuSlice.find(skuFilter)
    .select("konkName date data")
    .lean()
    .cursor({ batchSize: 25 });

  for await (const doc of skuCursor) {
    skuDocsScanned += 1;
    const day = toSliceDate(doc.date).toISOString().slice(0, 10);
    const { next, changed } = stripSalesFieldsFromData(
      doc.data as Record<string, Record<string, unknown>>,
    );
    if (changed) {
      skuDocsTouched += 1;
      if (apply) {
        await SkuSlice.updateOne(
          { konkName: doc.konkName, date: doc.date },
          { $set: { data: next } },
        );
      }
    }
    onProgress?.({
      phase: "sku",
      event: "doc",
      scanned: skuDocsScanned,
      total: skuTotal,
      touched: skuDocsTouched,
      konkName: doc.konkName,
      day,
    });
  }

  const btradeTotal = await BtradeSlice.countDocuments(dateFilter);
  onProgress?.({
    phase: "btrade",
    event: "phase-start",
    scanned: 0,
    total: btradeTotal,
    touched: 0,
  });

  let btradeDocsScanned = 0;
  let btradeDocsTouched = 0;
  const btradeCursor = BtradeSlice.find(dateFilter)
    .select("date data")
    .lean()
    .cursor({ batchSize: 25 });

  for await (const doc of btradeCursor) {
    btradeDocsScanned += 1;
    const day = toSliceDate(doc.date).toISOString().slice(0, 10);
    const { next, changed } = stripSalesFieldsFromData(
      doc.data as Record<string, Record<string, unknown>>,
    );
    if (changed) {
      btradeDocsTouched += 1;
      if (apply) {
        await BtradeSlice.updateOne({ date: doc.date }, { $set: { data: next } });
      }
    }
    onProgress?.({
      phase: "btrade",
      event: "doc",
      scanned: btradeDocsScanned,
      total: btradeTotal,
      touched: btradeDocsTouched,
      day,
    });
  }

  return {
    skuDocsScanned,
    skuDocsTouched,
    btradeDocsScanned,
    btradeDocsTouched,
    apply,
  };
}

export { stripSalesFieldsFromData };
