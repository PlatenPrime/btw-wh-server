import { Analog } from "../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../../analog-slices/models/AnalogSlice.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";
import { isFullMinusOneSliceItem } from "./isFullMinusOneSliceItem.js";

const DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AnalogSliceLean = {
  konkName: string;
  data?: Record<string, unknown>;
};

type AnalogIdLean = { _id: { toString(): string } };

/**
 * Повторный опрос позиций AnalogSlice за sliceDate с data entry stock/price оба -1.
 * При ответе, где уже не оба -1, перезаписывает ключ в том же документе.
 */
export async function runCompensatingAnalogSlices(
  sliceDate: Date
): Promise<{ refetched: number; updated: number }> {
  const excluded = getExcludedCompetitorSet("analogSlices");
  const docs = (await AnalogSlice.find({ date: sliceDate })
    .select("konkName data")
    .lean()) as AnalogSliceLean[];

  type Work = { konkName: string; artikulKey: string };
  const queue: Work[] = [];

  for (const doc of docs) {
    const kn = doc.konkName ?? "";
    if (excluded.has(normalizeCompetitorName(kn))) continue;
    const data = doc.data ?? {};
    for (const [artikulKey, item] of Object.entries(data)) {
      if (isFullMinusOneSliceItem(item)) {
        queue.push({ konkName: kn, artikulKey });
      }
    }
  }

  let refetched = 0;
  let updated = 0;

  for (let i = 0; i < queue.length; i++) {
    const { konkName, artikulKey } = queue[i]!;
    try {
      const analog = (await Analog.findOne({ konkName, artikul: artikulKey })
        .select("_id")
        .lean()) as AnalogIdLean | null;
      if (!analog) {
        console.warn(
          `[CompensatingAnalogSlices] нет аналога ${artikulKey} у ${konkName}, пропуск`
        );
        continue;
      }
      const result = await getAnalogStockDataUtil(analog._id.toString());
      if (!result) continue;
      refetched += 1;
      if (!(result.stock === -1 && result.price === -1)) {
        const dataItem: Record<string, unknown> = {
          stock: result.stock,
          price: result.price,
          artikul: artikulKey,
        };
        await AnalogSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${artikulKey}`]: dataItem } }
        );
        updated += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[CompensatingAnalogSlices] ${konkName} ${artikulKey}: ${msg}`
      );
    }
    if (i < queue.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return { refetched, updated };
}
