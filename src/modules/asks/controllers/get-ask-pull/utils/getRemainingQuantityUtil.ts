import { IAsk } from "../../../models/Ask.js";

/**
 * Рассчитывает оставшееся количество товара для снятия
 * @param ask - Ask объект с информацией о запросе
 * @returns Оставшееся количество для снятия или null если:
 *   - quant не указан в ask
 *   - уже все снято (remaining <= 0)
 */
export const getRemainingQuantityUtil = (ask: IAsk): number | null => {
  // Если quant не указан, возвращаем null
  if (typeof ask.quant !== "number" || ask.quant <= 0) {
    return null;
  }

  // Получаем уже снятое количество
  const currentPull = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;

  // Рассчитываем оставшееся количество
  const remaining = ask.quant - currentPull;

  // Если оставшееся количество <= 0, значит уже все снято
  return remaining > 0 ? remaining : null;
};

