import { SkuStockBand } from "../../../../sku-stock-bands/models/SkuStockBand.js";
import {
  discoverBandSpikeUtil,
  type DiscoverBandSpikeItem,
} from "../../discover-band-spike/utils/discoverBandSpikeUtil.js";
import type { DiscoverStockBandInput } from "../schemas/discoverStockBandSchema.js";

export type DiscoverStockBandOkResult = {
  ok: true;
  bandId: string;
  konkName: string;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number; normalMax: number };
  items: DiscoverBandSpikeItem[];
};

export type DiscoverStockBandFailResult = {
  ok: false;
  code: "BAND_NOT_FOUND";
  message: string;
};

export type DiscoverStockBandResult = DiscoverStockBandOkResult | DiscoverStockBandFailResult;

export async function discoverStockBandUtil(
  input: DiscoverStockBandInput,
): Promise<DiscoverStockBandResult> {
  const stockBand = await SkuStockBand.findById(input.bandId).lean();
  if (!stockBand) {
    return { ok: false, code: "BAND_NOT_FOUND", message: "Sku stock band not found" };
  }

  const discovered = await discoverBandSpikeUtil({
    konkName: stockBand.konk.name,
    stockMin: stockBand.stockMin,
    stockMax: stockBand.stockMax,
    normalMax: stockBand.normalMax,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });

  return {
    ok: true,
    bandId: String(stockBand._id),
    konkName: discovered.konkName,
    window: discovered.window,
    band: {
      min: stockBand.stockMin,
      max: stockBand.stockMax,
      normalMax: stockBand.normalMax,
    },
    items: discovered.items,
  };
}
