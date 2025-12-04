/**
 * Рассчитывает оставшееся количество товара для снятия
 * @param ask - Ask объект с информацией о запросе
 * @returns Оставшееся количество для снятия:
 *   - null - если quant не указан в ask
 *   - 0 - если уже все снято (pullQuant >= quant)
 *   - number > 0 - оставшееся количество для снятия
 */
export const getRemainingQuantityUtil = (ask) => {
    // Если quant не указан, возвращаем null
    if (typeof ask.quant !== "number" || ask.quant <= 0) {
        return null;
    }
    // Получаем уже снятое количество
    const currentPull = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;
    // Рассчитываем оставшееся количество
    const remaining = ask.quant - currentPull;
    // Если оставшееся количество <= 0, значит уже все снято - возвращаем 0
    return remaining > 0 ? remaining : 0;
};
