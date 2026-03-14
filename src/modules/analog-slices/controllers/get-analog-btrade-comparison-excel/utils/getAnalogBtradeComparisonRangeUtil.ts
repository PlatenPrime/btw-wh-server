import { Analog } from "../../../../analogs/models/Analog.js";
import { Art } from "../../../../arts/models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { BtradeSlice } from "../../../../btrade-slices/models/BtradeSlice.js";
import type { IBtradeSliceDataItem } from "../../../../btrade-slices/models/BtradeSlice.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import type { IAnalogSliceDataItem } from "../../../models/AnalogSlice.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
import type { GetAnalogBtradeComparisonExcelInput } from "../schemas/getAnalogBtradeComparisonExcelSchema.js";
import { Konk } from "../../../../konks/models/Konk.js";

export type AnalogBtradeCompareItem = {
  date: Date;
  analogStock: number | null;
  analogPrice: number | null;
  btradeStock: number | null;
  btradePrice: number | null;
};

export type GetAnalogBtradeComparisonRangeResult =
  | {
      ok: true;
      data: AnalogBtradeCompareItem[];
      artikul: string;
      artNameUkr: string | null;
      artAbc: string | null;
      producerName: string | null;
      competitorTitle: string | null;
    }
  | { ok: false };

/**
 * Возвращает массив данных сравнения срезов по аналогу и Btrade за период дат.
 * Для каждой даты в диапазоне (dateFrom..dateTo, включая границы) добавляется запись,
 * если есть данные хотя бы у конкурента, либо у Btrade.
 *
 * ok: false — аналог не найден или у аналога пустой artikul.
 */
export async function getAnalogBtradeComparisonRangeUtil(
  input: GetAnalogBtradeComparisonExcelInput
): Promise<GetAnalogBtradeComparisonRangeResult> {
  const analog = await Analog.findById(input.analogId)
    .select("konkName artikul prodName")
    .lean();

  if (!analog) return { ok: false };

  const artikulKey = analog.artikul?.trim();
  if (!artikulKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const artDoc = await Art.findOne({ artikul: artikulKey })
    .select("nameukr abc")
    .lean();
  const artNameUkr = (artDoc?.nameukr ?? "").trim() || null;
  const artAbc = (artDoc?.abc ?? "").trim() || null;

  const prodDoc = await Prod.findOne({ name: analog.prodName })
    .select("title")
    .lean();
  const producerName = (prodDoc?.title ?? "").trim() || null;

  const konkDoc = await Konk.findOne({ name: analog.konkName })
    .select("title")
    .lean();
  const competitorTitle = (konkDoc?.title ?? "").trim() || null;

  // Загружаем документы срезов конкурента за диапазон
  const analogDocs = await AnalogSlice.find({
    konkName: analog.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const analogByDate = new Map<number, IAnalogSliceDataItem>();
  for (const doc of analogDocs) {
    const normalizedDate = toSliceDate(doc.date);
    const dataRecord = (doc.data ?? {}) as Record<string, IAnalogSliceDataItem>;
    const item = dataRecord[artikulKey];
    if (!item) continue;
    analogByDate.set(normalizedDate.getTime(), item);
  }

  // Загружаем документы срезов Btrade за диапазон
  const btradeDocs = await BtradeSlice.find({
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const btradeByDate = new Map<number, IBtradeSliceDataItem>();
  for (const doc of btradeDocs) {
    const normalizedDate = toSliceDate(doc.date);
    const dataRecord = (doc.data ?? {}) as Record<string, IBtradeSliceDataItem>;
    const item = dataRecord[artikulKey];
    if (!item) continue;
    btradeByDate.set(normalizedDate.getTime(), item);
  }

  const data: AnalogBtradeCompareItem[] = [];
  const cursor = new Date(dateFrom);

  while (cursor.getTime() <= dateTo.getTime()) {
    const key = cursor.getTime();
    const analogItem = analogByDate.get(key);
    const btradeItem = btradeByDate.get(key);

    data.push({
      date: new Date(cursor),
      analogStock: analogItem?.stock ?? null,
      analogPrice: analogItem?.price ?? null,
      btradeStock: btradeItem?.quantity ?? null,
      btradePrice: btradeItem?.price ?? null,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    ok: true,
    data,
    artikul: artikulKey,
    artNameUkr,
    artAbc,
    producerName,
    competitorTitle,
  };
}

