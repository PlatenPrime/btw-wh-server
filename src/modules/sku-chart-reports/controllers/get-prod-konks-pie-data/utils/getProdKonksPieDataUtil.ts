import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { aggregateBtradeSalesForProdPeriod } from "../../../../sku-reporting/utils/aggregateBtradeSalesForProdPeriod.js";
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

type KonkLean = {
  name: string;
  title: string;
};

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
 * Competitor — SkuManufacturerDaySales; Btrade — BtradeManufacturerDaySales.
 * excludeKonks: konkName и/или `btrade` исключаются из расчёта и из `all`.
 */
export async function getProdKonksPieDataUtil(
  input: GetProdKonksPieDataInput,
): Promise<GetProdKonksPieDataResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const excludeKonks = (input.excludeKonks ?? []).filter((s) => s.length > 0);
  const excludeSet = new Set(excludeKonks);
  const excludeKonkNames = excludeKonks.filter((name) => name !== BTRADE_KEY);
  const data: Record<string, KonkPieItem> = {};

  const rollupRows = await sumManufacturerSalesByKonkName({
    prodName: input.prod,
    dateFrom,
    dateTo,
    ...(excludeKonkNames.length > 0 ? { excludeKonkNames } : {}),
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
  }

  if (!excludeSet.has(BTRADE_KEY)) {
    const btrade = await aggregateBtradeSalesForProdPeriod({
      dateFrom,
      dateTo,
      prod: input.prod,
    });
    if (btrade.ok) {
      data[BTRADE_KEY] = {
        title: BTRADE_TITLE,
        salesPcs: btrade.salesPcs,
        salesUah: btrade.salesUah,
      };
    }
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
