import type { Types } from "mongoose";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";
import type { ResolvedSkuRow } from "./resolveKonkProdSkus.js";

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  title: string;
  url: string;
  imageUrl?: string;
  createdAt?: Date;
};

type SkugrLean = {
  _id: Types.ObjectId;
  title: string;
  skus: Types.ObjectId[];
};

/**
 * Произвольный мультивыбор SKU по `_id` (в т.ч. разных конкурентов).
 * Порядок = первый проход по `skuIds` после dedupe; отсутствующие id пропускаются.
 * `skugrTitle` — первая (по `_id`) группа, в `skus[]` которой есть карточка.
 * SKU без `productId` пропускаются.
 */
export function dedupeSkuIdsPreserveOrder(skuIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of skuIds) {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export async function resolveSkusByIds(skuIds: string[]): Promise<ResolvedSkuRow[]> {
  const orderedIds = dedupeSkuIdsPreserveOrder(skuIds);
  if (orderedIds.length === 0) return [];

  const skuDocs = await Sku.find({ _id: { $in: orderedIds } })
    .select("konkName prodName productId title url imageUrl createdAt")
    .lean<SkuLean[]>();

  if (skuDocs.length === 0) return [];

  const skuById = new Map(skuDocs.map((s) => [s._id.toString(), s] as const));
  const foundIds = orderedIds.filter((id) => skuById.has(id));
  if (foundIds.length === 0) return [];

  const skugrs = await Skugr.find({ skus: { $in: foundIds } })
    .sort({ _id: 1 })
    .select("title skus")
    .lean<SkugrLean[]>();

  const firstSkugrBySkuId = new Map<string, SkugrLean>();
  for (const skugr of skugrs) {
    for (const skuId of skugr.skus ?? []) {
      const key = skuId.toString();
      if (firstSkugrBySkuId.has(key)) continue;
      firstSkugrBySkuId.set(key, skugr);
    }
  }

  const rows: ResolvedSkuRow[] = [];
  for (const id of foundIds) {
    const sku = skuById.get(id)!;
    const productId = (sku.productId ?? "").trim();
    if (!productId) continue;

    const skugr = firstSkugrBySkuId.get(id);
    rows.push({
      _id: sku._id,
      konkName: sku.konkName,
      prodName: sku.prodName,
      productId,
      title: sku.title,
      url: sku.url,
      imageUrl: (sku.imageUrl ?? "").trim(),
      createdAt: sku.createdAt,
      skugrId: skugr ? skugr._id.toString() : null,
      skugrTitle: skugr?.title ?? "",
    });
  }
  return rows;
}
