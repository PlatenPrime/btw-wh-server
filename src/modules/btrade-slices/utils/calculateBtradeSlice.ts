import { toSliceDate } from "../../../utils/sliceDate.js";
import { isInvalidSliceStockPriceItem } from "../../slices/utils/isInvalidSliceStockPriceItem.js";
import { fetchSharikProductRestsMap } from "../sharik/fetchSharikProductRestsMap.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
import type { IBtradeSliceDataItem } from "../models/BtradeSlice.js";
import { fetchMissingBtradeSliceItemsViaSearch } from "./calculateBtradeSliceViaSearch.js";
import { getUniqueArtikulsFromArtsUtil } from "./getUniqueArtikulsFromArtsUtil.js";

const MISSING_SLICE_SENTINEL: IBtradeSliceDataItem = { price: -1, quantity: -1 };

/**
 * Собирает ежедневный срез цен и остатков Btrade (Sharik):
 * один запрос product_rests, затем fallback search для пропущенных артикулов,
 * одна запись data в MongoDB.
 */
export async function calculateBtradeSlice(): Promise<{
  saved: boolean;
  count: number;
  totalArtikuls: number;
  missing: number;
  fromProductRests: number;
  fromSearch: number;
}> {
  const sliceDate = toSliceDate(new Date());
  const artikuls = await getUniqueArtikulsFromArtsUtil();
  const totalArtikuls = artikuls.length;

  console.log(
    `[BtradeSlice] Загрузка product_rests, артикулов в arts: ${artikuls.length}`
  );

  const productRestsMap = await fetchSharikProductRestsMap();

  const data: Record<string, IBtradeSliceDataItem> = {};
  for (const artikul of artikuls) {
    const row = productRestsMap.get(artikul);
    if (row) {
      data[artikul] = { price: row.price, quantity: row.quantity };
    }
  }

  const fromProductRests = Object.keys(data).length;
  const missingArtikuls = artikuls.filter((artikul) => !(artikul in data));

  if (missingArtikuls.length > 0) {
    console.log(
      `[BtradeSlice] Fallback search для ${missingArtikuls.length} артикулов`
    );
    const fromSearch = await fetchMissingBtradeSliceItemsViaSearch(
      missingArtikuls
    );
    Object.assign(data, fromSearch);
  }

  const fromSearchCount = Object.keys(data).length - fromProductRests;

  const stillMissingArtikuls = artikuls.filter((artikul) => !(artikul in data));
  for (const artikul of stillMissingArtikuls) {
    data[artikul] = MISSING_SLICE_SENTINEL;
  }

  let count = 0;
  let missing = 0;
  for (const artikul of artikuls) {
    const item = data[artikul]!;
    if (isInvalidSliceStockPriceItem(item.quantity, item.price)) {
      missing += 1;
    } else {
      count += 1;
    }
  }

  await BtradeSlice.findOneAndUpdate(
    { date: sliceDate },
    { $set: { date: sliceDate, data } },
    { upsert: true }
  );

  console.log(
    `[BtradeSlice] Готово: product_rests=${fromProductRests}, search fallback=${fromSearchCount}, valid=${count}, missing=${missing}`
  );

  return {
    saved: true,
    count,
    totalArtikuls,
    missing,
    fromProductRests,
    fromSearch: fromSearchCount,
  };
}
