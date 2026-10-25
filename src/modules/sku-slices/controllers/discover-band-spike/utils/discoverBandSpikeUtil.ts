import { Sku } from "../../../../skus/models/Sku.js";
import { enumerateReportingDates } from "../../../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { detectBandSpikeExits } from "../../../utils/detectBandSpikeExits.js";
import { addUtcDays, toUtcYmd } from "../../../utils/reviewPackFlipsUtil.js";
import { loadDayMapsForKonkDates } from "../../../utils/skuSliceMonthStore.js";
import type { ISkuSliceDataItem } from "../../../models/skuSliceTypes.js";
import type { RtlBandStockDay } from "../../../utils/computeRtlBandSpikePatches.js";
import type { DiscoverBandSpikeInput } from "../schemas/discoverBandSpikeSchema.js";

export type DiscoverBandSpikeRun = {
  dateFrom: string;
  dateTo: string;
  peakStock: number;
};

export type DiscoverBandSpikeItem = {
  skuId: string | null;
  productId: string;
  title: string | null;
  imageUrl: string | null;
  runs: DiscoverBandSpikeRun[];
};

export type DiscoverBandSpikeResult = {
  konkName: string;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number };
  items: DiscoverBandSpikeItem[];
};

type SkuMeta = {
  skuId: string;
  title: string;
  imageUrl: string;
};

function readStock(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return undefined;
  }
  const stock = (raw as { stock?: unknown }).stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : undefined;
}

function collectProductIds(dataByDate: Map<number, Record<string, ISkuSliceDataItem>>): string[] {
  const ids = new Set<string>();
  for (const data of dataByDate.values()) {
    for (const key of Object.keys(data)) {
      const pid = key.trim();
      if (pid.length > 0) ids.add(pid);
    }
  }
  return [...ids];
}

function buildSeriesForProduct(
  productId: string,
  loadDates: Date[],
  dataByDate: Map<number, Record<string, ISkuSliceDataItem>>,
): RtlBandStockDay[] {
  return loadDates.map((date) => ({
    dateMs: date.getTime(),
    stock: readStock(dataByDate.get(date.getTime())?.[productId]),
  }));
}

async function loadSkuMetaByProductId(konkName: string): Promise<Map<string, SkuMeta>> {
  const rows = await Sku.find({ konkName }).select("_id productId title imageUrl").lean<
    {
      _id?: { toString(): string };
      productId?: string;
      title?: string;
      imageUrl?: string;
    }[]
  >();
  const map = new Map<string, SkuMeta>();
  for (const row of rows) {
    if (typeof row.productId !== "string" || !row.productId) continue;
    map.set(row.productId, {
      skuId: row._id ? row._id.toString() : "",
      title: typeof row.title === "string" ? row.title : "",
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : "",
    });
  }
  return map;
}

export async function discoverBandSpikeUtil(
  input: DiscoverBandSpikeInput,
): Promise<DiscoverBandSpikeResult> {
  const konkName = input.konkName;
  const stockMin = input.stockMin;
  const stockMax = input.stockMax;
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  // +1 day after window so exit on dateTo+1 is visible for trailing band runs ending on dateTo
  const loadFrom = dateFrom;
  const loadTo = addUtcDays(dateTo, 1);
  const loadDates = enumerateReportingDates(loadFrom, loadTo).map((d) => toSliceDate(d));

  const maps = await loadDayMapsForKonkDates(konkName, loadDates);
  const dataByDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const date of loadDates) {
    dataByDate.set(date.getTime(), maps.get(date.getTime()) ?? {});
  }

  const skuMeta = await loadSkuMetaByProductId(konkName);
  const productIds = collectProductIds(dataByDate);
  const items: DiscoverBandSpikeItem[] = [];

  for (const productId of productIds) {
    const series = buildSeriesForProduct(productId, loadDates, dataByDate);
    const exits = detectBandSpikeExits(
      series,
      dateFrom.getTime(),
      dateTo.getTime(),
      stockMin,
      stockMax,
    );
    if (exits.length === 0) continue;

    const meta = skuMeta.get(productId);
    items.push({
      skuId: meta?.skuId ? meta.skuId : null,
      productId,
      title: meta ? meta.title || null : null,
      imageUrl: meta?.imageUrl ? meta.imageUrl : null,
      runs: exits.map((run) => ({
        dateFrom: toUtcYmd(new Date(run.dateFromMs)),
        dateTo: toUtcYmd(new Date(run.dateToMs)),
        peakStock: run.peakStock,
      })),
    });
  }

  items.sort((a, b) => a.productId.localeCompare(b.productId));

  return {
    konkName,
    window: { dateFrom: toUtcYmd(dateFrom), dateTo: toUtcYmd(dateTo) },
    band: { min: stockMin, max: stockMax },
    items,
  };
}
