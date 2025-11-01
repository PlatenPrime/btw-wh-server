import { getPogrebiDefStocks } from "../../../../poses/utils/getPogrebiDefStocks.js";
import { getSharikStocks } from "../../../../poses/utils/getSharikStocks.js";
import { IDeficitCalculationResult } from "../../../models/Def.js";
import { filterDeficits } from "../../../utils/filterDeficits.js";
import { getArtLimits } from "../../../utils/getArtLimits.js";

/**
 * Выполняет расчет дефицитов без сохранения в БД
 * Чистая бизнес-логика расчета
 * @returns Promise<IDeficitCalculationResult> - результат расчета дефицитов
 */
export async function calculatePogrebiDefsUtil(): Promise<IDeficitCalculationResult> {
  const pogrebiDefStocks = await getPogrebiDefStocks();
  const artikuls = Object.keys(pogrebiDefStocks);
  const limits = await getArtLimits(artikuls);
  const defs = await getSharikStocks(pogrebiDefStocks, limits);
  const filteredDefs = filterDeficits(defs);

  return filteredDefs;
}

