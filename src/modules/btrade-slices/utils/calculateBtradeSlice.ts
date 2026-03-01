import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import { getUniqueArtikulsFromAnalogsUtil } from "./getUniqueArtikulsFromAnalogsUtil.js";

const DELAY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSliceDate(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/**
 * Собирает ежедневный срез цен и остатков Btrade (Sharik) по артикулам из analogs:
 * сначала создаёт документ среза с пустым data, затем по мере обработки каждого артикула
 * (с паузой 5 сек) добавляет запись в data.
 * Ошибка по одному артикулу не прерывает обработку остальных.
 */
export async function calculateBtradeSlice(): Promise<{
  saved: boolean;
  count: number;
}> {
  const sliceDate = toSliceDate(new Date());
  const artikuls = await getUniqueArtikulsFromAnalogsUtil();

  await BtradeSlice.findOneAndUpdate(
    { date: sliceDate },
    { $setOnInsert: { date: sliceDate, data: {} } },
    { upsert: true }
  );

  let count = 0;
  for (let i = 0; i < artikuls.length; i++) {
    const artikul = artikuls[i];
    console.log(`анализируется артикул ${artikul} Btrade`);
    try {
      const result = await getSharikStockData(artikul);
      if (result) {
        await BtradeSlice.findOneAndUpdate(
          { date: sliceDate },
          { $set: { [`data.${artikul}`]: { price: result.price, quantity: result.quantity } } }
        );
        count += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[BtradeSlice] ${artikul}: ${msg}`);
    }
    if (i < artikuls.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return { saved: true, count };
}
