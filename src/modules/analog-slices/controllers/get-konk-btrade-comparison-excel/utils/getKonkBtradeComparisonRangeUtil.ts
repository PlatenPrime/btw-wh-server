import { Analog } from "../../../../analogs/models/Analog.js";
import { Art } from "../../../../arts/models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";
import {
  BtradeSlice,
  type IBtradeSliceDataItem,
} from "../../../../btrade-slices/models/BtradeSlice.js";
import {
  AnalogSlice,
  type IAnalogSliceDataItem,
} from "../../../models/AnalogSlice.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
import type { GetKonkBtradeComparisonExcelInput } from "../schemas/getKonkBtradeComparisonExcelSchema.js";
import type { AnalogBtradeCompareItem } from "../../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";

/**
 * Extracts the numeric part from the beginning of ABC value (e.g. "101B" → 101).
 * Returns 0 if no leading digits.
 */
export function parseAbcNumeric(artAbc: string | null): number {
  if (artAbc == null || artAbc === "") return 0;
  const match = artAbc.trim().match(/^(\d+)/);
  return match ? parseInt(match[1]!, 10) : 0;
}

export interface KonkAnalogInfo {
  analogId: string;
  artikul: string;
  artNameUkr: string | null;
  artAbc: string | null;
  producerName: string | null;
  competitorTitle: string | null;
  items: AnalogBtradeCompareItem[];
}

export type GetKonkBtradeComparisonRangeResult =
  | {
      ok: true;
      analogs: KonkAnalogInfo[];
      dateFrom: Date;
      dateTo: Date;
      konk: string;
      prod: string;
    }
  | { ok: false };

export async function getKonkBtradeComparisonRangeUtil(
  input: GetKonkBtradeComparisonExcelInput,
): Promise<GetKonkBtradeComparisonRangeResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const analogDocs = await Analog.find({
    konkName: input.konk,
    prodName: input.prod,
  })
    .select("_id artikul konkName prodName")
    .lean();

  const preparedAnalogs = analogDocs
    .map((doc) => {
      const artikul = doc.artikul?.trim() ?? "";
      if (!artikul) return null;

      return {
        analogId: doc._id.toString(),
        konkName: doc.konkName,
        prodName: doc.prodName,
        artikul,
      };
    })
    .filter(
      (item): item is { analogId: string; konkName: string; prodName: string; artikul: string } =>
        item !== null,
    );

  if (preparedAnalogs.length === 0) {
    return { ok: false };
  }

  const artikulSet = new Set<string>();
  const prodNameSet = new Set<string>();
  for (const analog of preparedAnalogs) {
    artikulSet.add(analog.artikul);
    prodNameSet.add(analog.prodName);
  }

  const artikulList = Array.from(artikulSet);
  const prodNameList = Array.from(prodNameSet);

  const [artDocs, prodDocs, konkDoc] = await Promise.all([
    Art.find({ artikul: { $in: artikulList } }).select("artikul nameukr abc").lean(),
    Prod.find({ name: { $in: prodNameList } }).select("name title").lean(),
    Konk.findOne({ name: input.konk }).select("title").lean(),
  ]);

  const artNameByArtikul = new Map<string, string | null>();
  const artAbcByArtikul = new Map<string, string | null>();
  for (const art of artDocs) {
    const artikul = (art.artikul ?? "").trim();
    if (!artikul) continue;
    artNameByArtikul.set(artikul, (art.nameukr ?? "").trim() || null);
    artAbcByArtikul.set(artikul, (art.abc ?? "").trim() || null);
  }

  const producerTitleByProdName = new Map<string, string | null>();
  for (const prod of prodDocs) {
    const name = (prod.name ?? "").trim();
    const title = (prod.title ?? "").trim() || null;
    if (!name) continue;
    producerTitleByProdName.set(name, title);
  }

  const competitorTitle = (konkDoc?.title ?? "").trim() || null;

  const analogSlices = await AnalogSlice.find({
    konkName: input.konk,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const analogByArtikulAndDate = new Map<string, Map<number, IAnalogSliceDataItem>>();
  for (const slice of analogSlices) {
    const normalizedDate = toSliceDate(slice.date);
    const dateKey = normalizedDate.getTime();
    const dataRecord = (slice.data ?? {}) as Record<string, IAnalogSliceDataItem>;

    for (const [artikul, item] of Object.entries(dataRecord)) {
      if (!artikulSet.has(artikul)) continue;
      let byDate = analogByArtikulAndDate.get(artikul);
      if (!byDate) {
        byDate = new Map<number, IAnalogSliceDataItem>();
        analogByArtikulAndDate.set(artikul, byDate);
      }
      byDate.set(dateKey, item);
    }
  }

  const btradeSlices = await BtradeSlice.find({
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const btradeByArtikulAndDate = new Map<string, Map<number, IBtradeSliceDataItem>>();
  for (const slice of btradeSlices) {
    const normalizedDate = toSliceDate(slice.date);
    const dateKey = normalizedDate.getTime();
    const dataRecord = (slice.data ?? {}) as Record<string, IBtradeSliceDataItem>;

    for (const [artikul, item] of Object.entries(dataRecord)) {
      if (!artikulSet.has(artikul)) continue;
      let byDate = btradeByArtikulAndDate.get(artikul);
      if (!byDate) {
        byDate = new Map<number, IBtradeSliceDataItem>();
        btradeByArtikulAndDate.set(artikul, byDate);
      }
      byDate.set(dateKey, item);
    }
  }

  const dateKeys: number[] = [];
  {
    const cursor = new Date(dateFrom);
    while (cursor.getTime() <= dateTo.getTime()) {
      dateKeys.push(cursor.getTime());
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  let analogs: KonkAnalogInfo[] = preparedAnalogs
    .slice()
    .sort((a, b) => a.artikul.localeCompare(b.artikul))
    .map((analog) => {
      const artNameUkr = artNameByArtikul.get(analog.artikul) ?? null;
      const artAbc = artAbcByArtikul.get(analog.artikul) ?? null;
      const producerName =
        producerTitleByProdName.get(analog.prodName) ?? null;

      const analogByDate =
        analogByArtikulAndDate.get(analog.artikul) ?? new Map();
      const btradeByDate =
        btradeByArtikulAndDate.get(analog.artikul) ?? new Map();

      const items: AnalogBtradeCompareItem[] = dateKeys.map((time) => {
        const date = new Date(time);
        const analogItem = analogByDate.get(time);
        const btradeItem = btradeByDate.get(time);

        return {
          date,
          analogStock: analogItem?.stock ?? null,
          analogPrice: analogItem?.price ?? null,
          btradeStock: btradeItem?.quantity ?? null,
          btradePrice: btradeItem?.price ?? null,
        };
      });

      return {
        analogId: analog.analogId,
        artikul: analog.artikul,
        artNameUkr,
        artAbc,
        producerName,
        competitorTitle,
        items,
      };
    });

  if (input.abc != null) {
    const abcUpper = input.abc.toUpperCase();
    analogs = analogs.filter(
      (a) =>
        (a.artAbc ?? "").toUpperCase().includes(abcUpper),
    );
  }

  if (analogs.length === 0) {
    return { ok: false };
  }

  const useSortByAbc =
    input.abc != null && input.sortBy === "abc";

  if (useSortByAbc) {
    analogs = analogs
      .slice()
      .sort((a, b) => {
        const numA = parseAbcNumeric(a.artAbc);
        const numB = parseAbcNumeric(b.artAbc);
        if (numA !== numB) return numA - numB;
        return a.artikul.localeCompare(b.artikul);
      });
  } else {
    analogs = analogs
      .slice()
      .sort((a, b) => a.artikul.localeCompare(b.artikul));
  }

  return {
    ok: true,
    analogs,
    dateFrom,
    dateTo,
    konk: input.konk,
    prod: input.prod,
  };
}

