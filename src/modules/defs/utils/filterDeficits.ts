import { ISharikStocksResult } from "../../poses/utils/getSharikStocks.js";

/**
 * Фильтрует дефициты по лимитам и difQuant
 * @param defs - Результат с данными Sharik
 * @returns Отфильтрованные дефициты
 */
export function filterDeficits(defs: ISharikStocksResult): ISharikStocksResult {
  const filteredDefs: ISharikStocksResult = {};

  Object.entries(defs).forEach(([artikul, data]) => {
    const { difQuant, quant, limit } = data;

    // Включаем в дефициты если:
    // 1. difQuant <= 0 (реальный дефицит)
    // 2. ИЛИ quant <= limit (приближение к лимиту)
    const isDeficit = difQuant <= 0 || (limit !== undefined && quant <= limit);

    if (isDeficit) {
      filteredDefs[artikul] = data;
    }
  });

  return filteredDefs;
}
