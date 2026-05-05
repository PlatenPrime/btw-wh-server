import type { Types } from "mongoose";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";

/**
 * SKU выборка для konk-prod отчётов с опциональным фильтром по товарным группам.
 *
 * Без `skugrIds`: SKU отбираются как раньше (по `konkName` + опционально `prodName`),
 * сортировка по `productId`. Колонка «Товарна група» в Excel заполняется первой
 * (по `_id`) группой Skugr с тем же `konkName`/`prodName`, в `skus[]` которой
 * встречается этот SKU; если ни в одну — пустая строка.
 *
 * С `skugrIds`: SKU собираются строго из выбранных групп Skugr. Группы фильтруются
 * по `konkName` (всегда) и `prodName` (если задан). Порядок групп — порядок
 * присланного `skugrIds`. Внутри группы — порядок `skugr.skus[]`. Дедупликация
 * по `productId`: побеждает первое вхождение, эта же группа становится «товарной
 * группой» SKU. Если задан `prod`, SKU другого `prodName` отфильтровываются.
 */
export type ResolvedSkuRow = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  title: string;
  url: string;
  createdAt?: Date;
  skugrId: string | null;
  skugrTitle: string;
};

export type ResolveKonkProdSkusInput = {
  konk: string;
  /** Если не задан — по производителю не фильтруем (для pie-данных). */
  prod?: string;
  skugrIds?: string[];
};

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  title: string;
  url: string;
  createdAt?: Date;
};

type SkugrLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  skus: Types.ObjectId[];
};

const isAllProd = (prod: string | undefined): boolean =>
  typeof prod === "string" && prod.trim() === "all";

export async function resolveKonkProdSkus(
  input: ResolveKonkProdSkusInput,
): Promise<ResolvedSkuRow[]> {
  const skugrIds = (input.skugrIds ?? []).filter((id) => id.length > 0);
  return skugrIds.length > 0
    ? resolveBySkugrIds(input, skugrIds)
    : resolveByKonkProd(input);
}

async function resolveByKonkProd(
  input: ResolveKonkProdSkusInput,
): Promise<ResolvedSkuRow[]> {
  const skuFilter: Record<string, unknown> = { konkName: input.konk };
  if (input.prod !== undefined && !isAllProd(input.prod)) {
    skuFilter.prodName = input.prod;
  }

  const skus = await Sku.find(skuFilter)
    .sort({ productId: 1 })
    .select("konkName prodName productId title url createdAt")
    .lean<SkuLean[]>();

  if (skus.length === 0) return [];

  const skugrFilter: Record<string, unknown> = { konkName: input.konk };
  if (input.prod !== undefined && !isAllProd(input.prod)) {
    skugrFilter.prodName = input.prod;
  }

  const skugrs = await Skugr.find(skugrFilter)
    .sort({ _id: 1 })
    .select("konkName prodName title skus")
    .lean<SkugrLean[]>();

  const firstSkugrBySkuId = new Map<string, SkugrLean>();
  for (const skugr of skugrs) {
    for (const skuId of skugr.skus ?? []) {
      const key = skuId.toString();
      if (firstSkugrBySkuId.has(key)) continue;
      firstSkugrBySkuId.set(key, skugr);
    }
  }

  const seenProductIds = new Set<string>();
  const rows: ResolvedSkuRow[] = [];
  for (const sku of skus) {
    const productId = (sku.productId ?? "").trim();
    if (!productId || seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);

    const skugr = firstSkugrBySkuId.get(sku._id.toString());
    rows.push({
      _id: sku._id,
      konkName: sku.konkName,
      prodName: sku.prodName,
      productId,
      title: sku.title,
      url: sku.url,
      createdAt: sku.createdAt,
      skugrId: skugr ? skugr._id.toString() : null,
      skugrTitle: skugr?.title ?? "",
    });
  }
  return rows;
}

async function resolveBySkugrIds(
  input: ResolveKonkProdSkusInput,
  skugrIds: string[],
): Promise<ResolvedSkuRow[]> {
  const skugrFilter: Record<string, unknown> = {
    _id: { $in: skugrIds },
    konkName: input.konk,
  };
  if (input.prod !== undefined && !isAllProd(input.prod)) {
    skugrFilter.prodName = input.prod;
  }

  const skugrs = await Skugr.find(skugrFilter)
    .select("konkName prodName title skus")
    .lean<SkugrLean[]>();

  if (skugrs.length === 0) return [];

  const skugrById = new Map(skugrs.map((s) => [s._id.toString(), s] as const));
  const orderedSkugrs: SkugrLean[] = [];
  const seenSkugrIds = new Set<string>();
  for (const id of skugrIds) {
    const skugr = skugrById.get(id);
    if (!skugr || seenSkugrIds.has(id)) continue;
    seenSkugrIds.add(id);
    orderedSkugrs.push(skugr);
  }
  if (orderedSkugrs.length === 0) return [];

  const skuIdToSkugr = new Map<string, SkugrLean>();
  const orderedSkuIds: Types.ObjectId[] = [];
  for (const skugr of orderedSkugrs) {
    for (const skuId of skugr.skus ?? []) {
      const key = skuId.toString();
      if (skuIdToSkugr.has(key)) continue;
      skuIdToSkugr.set(key, skugr);
      orderedSkuIds.push(skuId);
    }
  }
  if (orderedSkuIds.length === 0) return [];

  const skuFilter: Record<string, unknown> = {
    _id: { $in: orderedSkuIds },
    konkName: input.konk,
  };
  if (input.prod !== undefined && !isAllProd(input.prod)) {
    skuFilter.prodName = input.prod;
  }

  const skuDocs = await Sku.find(skuFilter)
    .select("konkName prodName productId title url createdAt")
    .lean<SkuLean[]>();

  const skuById = new Map(skuDocs.map((s) => [s._id.toString(), s] as const));

  const seenProductIds = new Set<string>();
  const rows: ResolvedSkuRow[] = [];
  for (const skuId of orderedSkuIds) {
    const sku = skuById.get(skuId.toString());
    if (!sku) continue;
    const productId = (sku.productId ?? "").trim();
    if (!productId || seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);

    const skugr = skuIdToSkugr.get(skuId.toString())!;
    rows.push({
      _id: sku._id,
      konkName: sku.konkName,
      prodName: sku.prodName,
      productId,
      title: sku.title,
      url: sku.url,
      createdAt: sku.createdAt,
      skugrId: skugr._id.toString(),
      skugrTitle: skugr.title ?? "",
    });
  }
  return rows;
}
