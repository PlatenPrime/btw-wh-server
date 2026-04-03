import type { Types } from "mongoose";
import type { ISkuSliceDataItem } from "../models/SkuSlice.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";
import { toSliceDate } from "../../../utils/sliceDate.js";

export type SkugrReportingLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  skus: Types.ObjectId[];
};

export type SkuReportingLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  productId: string;
  createdAt?: Date;
};

/** Карта: konkName → (день UTC ms → data по productId). */
export type SliceMapsByKonk = Map<
  string,
  Map<number, Record<string, ISkuSliceDataItem>>
>;

export function enumerateReportingDates(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function buildSliceMapsByKonk(
  slices: Array<{ konkName: string; date: Date; data?: unknown }>,
): SliceMapsByKonk {
  const maps: SliceMapsByKonk = new Map();
  for (const sl of slices) {
    const kn = sl.konkName;
    let byDate = maps.get(kn);
    if (!byDate) {
      byDate = new Map();
      maps.set(kn, byDate);
    }
    const t = toSliceDate(sl.date).getTime();
    byDate.set(t, (sl.data ?? {}) as Record<string, ISkuSliceDataItem>);
  }
  return maps;
}

export function getSliceItem(
  maps: SliceMapsByKonk,
  konkName: string,
  productId: string,
  sliceDate: Date,
): ISkuSliceDataItem | undefined {
  const byDate = maps.get(konkName);
  if (!byDate) return undefined;
  const rec = byDate.get(toSliceDate(sliceDate).getTime());
  return rec?.[productId];
}

/**
 * Skugr + SKU в порядке skugr.skus; только SKU с непустым productId.
 */
export async function loadSkugrWithOrderedSkus(
  skugrId: string,
): Promise<{ skugr: SkugrReportingLean; skus: SkuReportingLean[] } | null> {
  const skugr = await Skugr.findById(skugrId)
    .select("konkName prodName title skus")
    .lean<SkugrReportingLean | null>();
  if (!skugr) return null;

  if (!skugr.skus?.length) {
    return { skugr, skus: [] };
  }

  const found = await Sku.find({ _id: { $in: skugr.skus } })
    .select("konkName prodName title url productId createdAt")
    .lean<SkuReportingLean[]>();

  const byId = new Map(found.map((s) => [s._id.toString(), s]));

  const skus: SkuReportingLean[] = [];
  for (const id of skugr.skus) {
    const s = byId.get(id.toString());
    if (!s) continue;
    const pid = (s.productId ?? "").trim();
    if (!pid) continue;
    skus.push({ ...s, productId: pid });
  }

  return { skugr, skus };
}

export function uniqueKonkNamesFromSkus(skus: SkuReportingLean[]): string[] {
  return [...new Set(skus.map((s) => s.konkName))];
}
