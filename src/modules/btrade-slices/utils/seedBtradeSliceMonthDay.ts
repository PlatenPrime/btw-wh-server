import type { IBtradeSliceDataItem } from "../models/btradeSliceTypes.js";
import { upsertDayPointsBulk } from "./btradeSliceMonthStore.js";

/**
 * Тестовый/скрипт-хелпер: записать дневную карту artikul → quantity/price в months.
 */
export async function seedBtradeSliceMonthDay(
  date: Date,
  data: Record<string, IBtradeSliceDataItem>,
): Promise<number> {
  const writes = Object.entries(data).map(([artikul, item]) => ({
    artikul,
    date,
    quantity: item.quantity,
    price: item.price,
  }));
  return upsertDayPointsBulk(writes);
}
