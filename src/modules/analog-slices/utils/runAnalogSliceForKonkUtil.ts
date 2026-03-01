import { Analog } from "../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../models/AnalogSlice.js";

const DELAY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Нормализует дату до начала дня по UTC (для консистентного хранения)
 */
export function toSliceDate(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

type AnalogLean = { _id: { toString(): string }; artikul?: string; title?: string };

/**
 * Собирает срез по всем аналогам конкурента: сначала создаёт документ среза с пустым data,
 * затем по мере обработки каждого аналога (с паузой 5 сек) добавляет запись в data.
 * Ошибка по одному аналогу не прерывает обработку остальных.
 */
export async function runAnalogSliceForKonkUtil(
  konkName: string,
  date: Date
): Promise<{ saved: boolean; count: number }> {
  const sliceDate = toSliceDate(date);
  const analogs = await Analog.find({ konkName })
    .select("_id artikul title")
    .lean() as AnalogLean[];

  await AnalogSlice.findOneAndUpdate(
    { konkName, date: sliceDate },
    { $setOnInsert: { konkName, date: sliceDate, data: {} } },
    { upsert: true }
  );

  let count = 0;
  for (let i = 0; i < analogs.length; i++) {
    const analog = analogs[i];
    const analogId = analog._id.toString();
    const label = analog.artikul?.trim() || analog.title?.trim() || analogId;
    console.log(`анализируется аналог ${label} конкурента ${konkName}`);

    try {
      const result = await getAnalogStockDataUtil(analogId);
      if (result) {
        const dataItem: Record<string, unknown> = {
          stock: result.stock,
          price: result.price,
        };
        if (analog.artikul?.trim()) {
          dataItem.artikul = analog.artikul.trim();
        } else if (analog.title?.trim()) {
          dataItem.title = analog.title.trim();
        }
        await AnalogSlice.findOneAndUpdate(
          { konkName, date: sliceDate },
          { $set: { [`data.${analogId}`]: dataItem } }
        );
        count += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AnalogSlice ${konkName}] ${analogId}: ${msg}`);
    }
    if (i < analogs.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return { saved: true, count };
}
