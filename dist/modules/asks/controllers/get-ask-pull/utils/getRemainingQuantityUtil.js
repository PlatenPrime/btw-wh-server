/**
 * Рассчитывает оставшееся количество товара для снятия
 * @param ask - Ask объект с информацией о запросе
 * @returns Оставшееся количество для снятия:
 *   - null - если quant не указан в ask
 *   - number - оставшееся количество для снятия
 */
export const getRemainingQuantityUtil = (ask) => {
    const pullQuant = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;
    if (typeof ask.quant !== "number" || ask.quant <= 0) {
        if (pullQuant > 0) {
            return -pullQuant;
        }
        return 0;
    }
    return ask.quant - pullQuant;
};
