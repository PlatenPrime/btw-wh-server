import { Prod } from "../../../../prods/models/Prod.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sumManufacturerSalesByProdName } from "../../../../sku-reporting/utils/aggregateManufacturerDaySales.js";
import { resolveKonkProdSkus } from "../../../../sku-reporting/utils/resolveKonkProdSkus.js";
import type { GetKonkProdManufacturersPieDataInput } from "../schemas/getKonkProdManufacturersPieDataSchema.js";

const ALL_MANUFACTURERS_TITLE = "Всі виробники";

type ManufacturerPieItem = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

export type GetKonkProdManufacturersPieDataResult =
  | {
      ok: true;
      data: Record<string, ManufacturerPieItem>;
      all: ManufacturerPieItem;
    }
  | { ok: false };

type ProdLean = {
  name: string;
  title: string;
};

/**
 * Pie по производителям: SkuManufacturerDaySales $match+$group by prodName.
 * Фильтр skugrIds: ограничиваем prodName через resolve → set of prodNames.
 */
export async function getKonkProdManufacturersPieDataUtil(
  input: GetKonkProdManufacturersPieDataInput,
): Promise<GetKonkProdManufacturersPieDataResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const skugrIds = (input.skugrIds ?? []).filter((s) => s.length > 0);
  let allowedProdNames: string[] | undefined;

  if (skugrIds.length > 0) {
    const resolved = await resolveKonkProdSkus({
      konk: input.konk,
      skugrIds,
    });
    const names = new Set<string>();
    for (const r of resolved) {
      const prodName = (r.prodName ?? "").trim();
      if (prodName) names.add(prodName);
    }
    if (names.size === 0) return { ok: false };
    allowedProdNames = [...names];
  }

  const rows = await sumManufacturerSalesByProdName({
    konkName: input.konk,
    dateFrom,
    dateTo,
    ...(allowedProdNames ? { prodNames: allowedProdNames } : {}),
  });

  if (rows.length === 0) return { ok: false };

  const manufacturerNames = rows.map((r) => r.key);
  const prodDocs = await Prod.find({ name: { $in: manufacturerNames } })
    .select("name title")
    .lean<ProdLean[]>();
  const prodTitleByName = new Map<string, string>();
  for (const prodDoc of prodDocs) {
    const name = (prodDoc.name ?? "").trim();
    const title = (prodDoc.title ?? "").trim();
    if (!name || !title) continue;
    prodTitleByName.set(name, title);
  }

  const result: Record<string, ManufacturerPieItem> = {};
  for (const row of rows) {
    result[row.key] = {
      title: prodTitleByName.get(row.key) ?? row.key,
      salesPcs: row.salesPcs,
      salesUah: row.salesUah,
    };
  }

  if (Object.keys(result).length === 0) return { ok: false };

  let totalPcs = 0;
  let totalUah = 0;
  for (const item of Object.values(result)) {
    totalPcs += item.salesPcs;
    totalUah += item.salesUah;
  }
  const all: ManufacturerPieItem = {
    title: ALL_MANUFACTURERS_TITLE,
    salesPcs: totalPcs,
    salesUah: Math.round(totalUah * 100) / 100,
  };

  return { ok: true, data: result, all };
}
