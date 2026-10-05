import type { Types } from "mongoose";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { aggregateBtradeSalesForProdPeriod } from "../../../../sku-reporting/utils/aggregateBtradeSalesForProdPeriod.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../../../../sku-reporting/utils/aggregateDailySkuSliceMetricsForSkus.js";
import { sumManufacturerSalesByKonkName } from "../../../../sku-reporting/utils/aggregateManufacturerDaySales.js";
import type { GetProdKonksPieDataInput } from "../schemas/getProdKonksPieDataSchema.js";

const ALL_KONKS_TITLE = "Всі конкуренти";
const BTRADE_KEY = "btrade";
const BTRADE_TITLE = "Btrade";

type KonkPieItem = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

export type GetProdKonksPieDataResult =
  | {
      ok: true;
      data: Record<string, KonkPieItem>;
      all: KonkPieItem;
    }
  | { ok: false };

type SkuLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
};

type SkugrLean = {
  _id: Types.ObjectId;
  prodName: string;
  skus: Types.ObjectId[];
};

type KonkLean = {
  name: string;
  title: string;
};

async function resolveSkusForProd(
  prod: string,
  skugrIds: string[],
): Promise<SkuLean[]> {
  if (skugrIds.length === 0) {
    return Sku.find({ prodName: prod })
      .select("_id konkName prodName productId")
      .lean<SkuLean[]>();
  }

  const skugrs = await Skugr.find({
    _id: { $in: skugrIds },
    prodName: prod,
  })
    .select("_id prodName skus")
    .lean<SkugrLean[]>();

  if (skugrs.length === 0) return [];

  const skugrById = new Map(skugrs.map((s) => [s._id.toString(), s] as const));
  const orderedSkuIds: Types.ObjectId[] = [];
  const seenSkuIds = new Set<string>();
  for (const id of skugrIds) {
    const skugr = skugrById.get(id);
    if (!skugr) continue;
    for (const skuId of skugr.skus ?? []) {
      const key = skuId.toString();
      if (seenSkuIds.has(key)) continue;
      seenSkuIds.add(key);
      orderedSkuIds.push(skuId);
    }
  }
  if (orderedSkuIds.length === 0) return [];

  const skuDocs = await Sku.find({
    _id: { $in: orderedSkuIds },
    prodName: prod,
  })
    .select("_id konkName prodName productId")
    .lean<SkuLean[]>();

  const skuById = new Map(skuDocs.map((s) => [s._id.toString(), s] as const));
  const rows: SkuLean[] = [];
  const seenProductIds = new Set<string>();
  for (const skuId of orderedSkuIds) {
    const sku = skuById.get(skuId.toString());
    if (!sku) continue;
    const productId = (sku.productId ?? "").trim();
    if (!productId || seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);
    rows.push(sku);
  }
  return rows;
}

async function loadKonkTitles(
  konkNames: string[],
): Promise<Map<string, string>> {
  if (konkNames.length === 0) return new Map();
  const konkDocs = await Konk.find({ name: { $in: konkNames } })
    .select("name title")
    .lean<KonkLean[]>();
  const titleByKonk = new Map<string, string>();
  for (const doc of konkDocs) {
    const name = (doc.name ?? "").trim();
    const title = (doc.title ?? "").trim();
    if (!name) continue;
    titleByKonk.set(name, title || name);
  }
  return titleByKonk;
}

/**
 * Pie по конкурентам для одного производителя.
 * Без skugrIds: competitor из SkuManufacturerDaySales.
 * С skugrIds: Mixed compute по productId subset (rollup не знает subset).
 */
export async function getProdKonksPieDataUtil(
  input: GetProdKonksPieDataInput,
): Promise<GetProdKonksPieDataResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const skugrIds = (input.skugrIds ?? []).filter((s) => s.length > 0);
  const data: Record<string, KonkPieItem> = {};
  const prodNamesLower = new Set<string>();

  if (skugrIds.length === 0) {
    const rollupRows = await sumManufacturerSalesByKonkName({
      prodName: input.prod,
      dateFrom,
      dateTo,
    });
    if (rollupRows.length > 0) {
      const titleByKonk = await loadKonkTitles(rollupRows.map((r) => r.key));
      for (const row of rollupRows) {
        data[row.key] = {
          title: titleByKonk.get(row.key) ?? row.key,
          salesPcs: row.salesPcs,
          salesUah: row.salesUah,
        };
      }
      prodNamesLower.add(input.prod.trim().toLowerCase());
    }
  } else {
    const skuDocs = await resolveSkusForProd(input.prod, skugrIds);

    const skusByKonk = new Map<
      string,
      Array<{ konkName: string; productId: string }>
    >();

    for (const doc of skuDocs) {
      const productId = (doc.productId ?? "").trim();
      const konkName = (doc.konkName ?? "").trim();
      if (!productId || !konkName) continue;
      const list = skusByKonk.get(konkName) ?? [];
      list.push({ konkName, productId });
      skusByKonk.set(konkName, list);
      const prodName = (doc.prodName ?? "").trim();
      if (prodName) prodNamesLower.add(prodName.toLowerCase());
    }

    if (skusByKonk.size > 0) {
      const titleByKonk = await loadKonkTitles([...skusByKonk.keys()]);

      for (const [konkName, skus] of skusByKonk) {
        const uniqueSkus = [
          ...new Map(skus.map((s) => [s.productId, s] as const)).values(),
        ];
        const metrics = await aggregateDailySkuSliceMetricsForSkus(
          uniqueSkus,
          dateFrom,
          dateTo,
        );

        let salesPcs = 0;
        let salesUah = 0;
        if (metrics.ok) {
          for (const day of metrics.data) {
            salesPcs += day.sales;
            salesUah += day.revenue;
          }
        }
        data[konkName] = {
          title: titleByKonk.get(konkName) ?? konkName,
          salesPcs,
          salesUah: Math.round(salesUah * 100) / 100,
        };
      }
    }
  }

  const btradeInput =
    skugrIds.length > 0
      ? {
          dateFrom,
          dateTo,
          prodNamesLower: [...prodNamesLower],
        }
      : {
          dateFrom,
          dateTo,
          prod: input.prod,
        };

  const btrade = await aggregateBtradeSalesForProdPeriod(btradeInput);
  if (btrade.ok) {
    data[BTRADE_KEY] = {
      title: BTRADE_TITLE,
      salesPcs: btrade.salesPcs,
      salesUah: btrade.salesUah,
    };
  }

  if (Object.keys(data).length === 0) return { ok: false };

  let totalPcs = 0;
  let totalUah = 0;
  for (const item of Object.values(data)) {
    totalPcs += item.salesPcs;
    totalUah += item.salesUah;
  }

  return {
    ok: true,
    data,
    all: {
      title: ALL_KONKS_TITLE,
      salesPcs: totalPcs,
      salesUah: Math.round(totalUah * 100) / 100,
    },
  };
}
