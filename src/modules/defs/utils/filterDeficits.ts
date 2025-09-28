import { ISharikStocksResult } from "../../poses/utils/getSharikStocks.js";
import { IDeficitCalculationResult } from "../models/Defcalc.js";

/**
 * Фильтрует дефициты по правильной логике:
 * - Критический дефицит: sharikQuant <= quant (difQuant <= 0)
 * - Лимитированный дефицит: sharikQuant <= defLimit (где defLimit = quant + artLimit)
 * @param defs - Результат с данными Sharik
 * @returns Отфильтрованные дефициты с правильно рассчитанным полем defLimit
 */
export function filterDeficits(
  defs: ISharikStocksResult
): IDeficitCalculationResult {
  const filteredDefs: IDeficitCalculationResult = {};

  Object.entries(defs).forEach(([artikul, data]) => {
    const { difQuant, quant, sharikQuant, limit: artLimit } = data;

    // Рассчитываем defLimit как quant + artLimit
    const defLimit = quant + (artLimit !== undefined ? artLimit : 0);

    // Включаем в дефициты если:
    // 1. sharikQuant <= quant (критический дефицит: difQuant <= 0)
    // 2. ИЛИ sharikQuant <= defLimit (лимитированный дефицит)
    const isCriticalDeficit = sharikQuant <= quant; // difQuant <= 0
    const isLimitDeficit = sharikQuant <= defLimit && sharikQuant > quant;

    if (isCriticalDeficit || isLimitDeficit) {
      filteredDefs[artikul] = {
        nameukr: data.nameukr || "",
        quant,
        sharikQuant,
        difQuant,
        defLimit,
      };
    }
  });

  return filteredDefs;
}
