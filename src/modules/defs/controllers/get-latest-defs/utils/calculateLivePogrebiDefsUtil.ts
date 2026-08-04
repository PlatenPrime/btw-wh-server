import { getPogrebiDefStocks } from "../../../../poses/utils/getPogrebiDefStocks.js";
import { getSharikStocks } from "../../../../poses/utils/getSharikStocks.js";
import type { ILiveDefsCalculation } from "../../../types.js";
import { calculateDeficitTotals } from "../../../utils/calculateTotals.js";
import { filterDeficits } from "../../../utils/filterDeficits.js";
import { getArtLimits } from "../../../utils/getArtLimits.js";

/**
 * Живой расчёт дефицитов: poses + product_rests (actualQuantity), без сохранения в БД.
 */
export async function calculateLivePogrebiDefsUtil(): Promise<ILiveDefsCalculation> {
  const pogrebiDefStocks = await getPogrebiDefStocks();
  const artikuls = Object.keys(pogrebiDefStocks);
  const limits = await getArtLimits(artikuls);
  const defs = await getSharikStocks(pogrebiDefStocks, limits);
  const filteredDefs = filterDeficits(defs);
  const totals = calculateDeficitTotals(filteredDefs);

  return {
    result: filteredDefs,
    total: totals.total,
    totalCriticalDefs: totals.totalCriticalDefs,
    totalLimitDefs: totals.totalLimitDefs,
    calculatedAt: new Date(),
  };
}
