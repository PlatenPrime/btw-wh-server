import { AIR_CLIENT_SKUGR_KONK } from "../../../constants/airClientSkugrFill.js";
import { Skugr } from "../../../models/Skugr.js";

export type AirClientSkugrPendingItem = {
  skugrId: string;
  title: string;
  url: string;
  prodName: string;
};

export type AirClientSkugrPendingResult = {
  items: AirClientSkugrPendingItem[];
};

/**
 * Все Air товарные группы с непустым url — очередь client refill.
 */
export async function getAirClientSkugrPendingUtil(): Promise<AirClientSkugrPendingResult> {
  const rows = await Skugr.find({
    konkName: { $regex: new RegExp(`^${AIR_CLIENT_SKUGR_KONK}$`, "i") },
  })
    .select("_id title url prodName")
    .lean()
    .exec();

  const items: AirClientSkugrPendingItem[] = [];
  for (const row of rows) {
    const url = (row.url ?? "").trim();
    if (!url) {
      continue;
    }
    items.push({
      skugrId: String(row._id),
      title: (row.title ?? "").trim(),
      url,
      prodName: (row.prodName ?? "").trim(),
    });
  }

  return { items };
}
