import { Art } from "../../arts/models/Art.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { sumBtradeManufacturerSalesForPeriod } from "./aggregateBtradeManufacturerDaySales.js";

export type AggregateBtradeSalesForProdPeriodInput = {
  dateFrom: Date;
  dateTo: Date;
  /**
   * Case-insensitive match Art.prodName === prod.
   * Ignored when `prodNamesLower` is non-empty (skugrIds path).
   */
  prod?: string;
  /** Lowercased trimmed prodNames from resolved SKUs (skugrIds filter). */
  prodNamesLower?: string[];
};

export type AggregateBtradeSalesForProdPeriodResult =
  | { ok: true; salesPcs: number; salesUah: number }
  | { ok: false };

function buildArtProdFilter(
  prodNamesLower: string[],
  prod?: string,
): Record<string, unknown> | null {
  if (prodNamesLower.length > 0) {
    return {
      $expr: {
        $in: [
          {
            $toLower: {
              $trim: { input: { $ifNull: ["$prodName", ""] } },
            },
          },
          prodNamesLower,
        ],
      },
    };
  }
  if (prod !== undefined && prod.trim() !== "") {
    return {
      $expr: {
        $eq: [
          {
            $toLower: {
              $trim: { input: { $ifNull: ["$prodName", ""] } },
            },
          },
          prod.trim().toLowerCase(),
        ],
      },
    };
  }
  return null;
}

/**
 * Сумма продаж/выручки Btrade за период — из BtradeManufacturerDaySales.
 * ok:false если нет Art с нужным prodName (сегмент btrade не показываем).
 */
export async function aggregateBtradeSalesForProdPeriod(
  input: AggregateBtradeSalesForProdPeriodInput,
): Promise<AggregateBtradeSalesForProdPeriodResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const prodNamesLower = (input.prodNamesLower ?? [])
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const names =
    prodNamesLower.length > 0
      ? prodNamesLower
      : input.prod !== undefined && input.prod.trim() !== ""
        ? [input.prod.trim().toLowerCase()]
        : [];

  if (names.length === 0) return { ok: false };

  const artFilter = buildArtProdFilter(prodNamesLower, input.prod);
  if (!artFilter) return { ok: false };

  const artCount = await Art.countDocuments(artFilter);
  if (artCount === 0) return { ok: false };

  const fromRollup = await sumBtradeManufacturerSalesForPeriod({
    dateFrom,
    dateTo,
    prodNamesLower: names,
  });

  return {
    ok: true,
    salesPcs: fromRollup?.salesPcs ?? 0,
    salesUah: fromRollup?.salesUah ?? 0,
  };
}
