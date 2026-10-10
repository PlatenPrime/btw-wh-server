import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";
import { upsertDayPointsBulk } from "./skuSliceMonthStore.js";

/**
 * Тестовый/скрипт-хелпер: записать дневную карту productId → stock/price в months.
 */
export async function seedSkuSliceMonthDay(
  konkName: string,
  date: Date,
  data: Record<string, ISkuSliceDataItem>,
): Promise<number> {
  const writes = Object.entries(data).map(([productId, item]) => ({
    konkName,
    productId,
    date,
    stock: item.stock,
    price: item.price,
  }));
  return upsertDayPointsBulk(writes);
}
