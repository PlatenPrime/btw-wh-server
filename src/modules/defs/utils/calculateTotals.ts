import { IDeficitCalculationResult } from "../models/Defcalc.js";

/**
 * Интерфейс для итоговых значений расчета дефицитов
 */
export interface IDeficitTotals {
  total: number;
  totalCriticalDefs: number;
  totalLimitDefs: number;
}

/**
 * Рассчитывает итоговые значения для дефицитов по правильной логике:
 * - Критический дефицит: sharikQuant <= quant (difQuant <= 0)
 * - Лимитированный дефицит: sharikQuant <= defLimit и sharikQuant > quant
 * @param result - Результат расчета дефицитов
 * @returns Объект с итоговыми значениями
 */
export function calculateDeficitTotals(
  result: IDeficitCalculationResult
): IDeficitTotals {
  let total = 0;
  let totalCriticalDefs = 0;
  let totalLimitDefs = 0;

  Object.values(result).forEach((item) => {
    total++;

    // Критический дефицит: sharikQuant <= quant (difQuant <= 0)
    if (item.sharikQuant <= item.quant) {
      totalCriticalDefs++;
    }
    // Лимитированный дефицит: sharikQuant <= defLimit и sharikQuant > quant
    else if (item.sharikQuant <= item.defLimit) {
      totalLimitDefs++;
    }
  });

  return {
    total,
    totalCriticalDefs,
    totalLimitDefs,
  };
}
