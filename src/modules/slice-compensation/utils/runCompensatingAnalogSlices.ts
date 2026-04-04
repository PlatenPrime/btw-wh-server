import { Analog } from "../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../../analog-slices/models/AnalogSlice.js";
import { getExcludedCompetitorSet } from "../../slices/config/excludedCompetitors.js";
import {
  buildCompensatingDataKeyQueue,
  runCompensatingSliceRefetchLoop,
} from "./compensatingSliceRunner.js";
import { isFullMinusOneSliceItem } from "./isFullMinusOneSliceItem.js";

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

  const queue = buildCompensatingDataKeyQueue(
    docs,
    excluded,
    isFullMinusOneSliceItem
  );

  return runCompensatingSliceRefetchLoop(queue, async ({ konkName, dataKey }) => {
    const artikulKey = dataKey;
    try {
      const analog = (await Analog.findOne({ konkName, artikul: artikulKey })
        .select("_id")
        .lean()) as AnalogIdLean | null;
      if (!analog) {
        console.warn(
          `[CompensatingAnalogSlices] нет аналога ${artikulKey} у ${konkName}, пропуск`
        );
        return { refetched: 0, updated: 0 };
      }
      const result = await getAnalogStockDataUtil(analog._id.toString());
      if (!result) return { refetched: 0, updated: 0 };
      let updated = 0;
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
        updated = 1;
      }
      return { refetched: 1, updated };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[CompensatingAnalogSlices] ${konkName} ${artikulKey}: ${msg}`
      );
      return { refetched: 0, updated: 0 };
    }
  });
}
