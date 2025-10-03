import { IDeficitCalculationResult } from "../models/Def.js";

/**
 * Интерфейс для итоговых значений расчета дефицитов
 */
export interface IDeficitTotals {
  total: number;
  totalCriticalDefs: number;
  totalLimitDefs: number;
}

/**
 * Рассчитывает итоговые значения для дефицитов используя поле status:
 * - Критический дефицит: status === 'critical'
 * - Лимитированный дефицит: status === 'limited'
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

    // Используем поле status для определения типа дефицита
    if (item.status === "critical") {
      totalCriticalDefs++;
    } else if (item.status === "limited") {
      totalLimitDefs++;
    }
  });

  return {
    total,
    totalCriticalDefs,
    totalLimitDefs,
  };
}
