/**
 * Значение годится для рядов отчётности: конечное число и не sentinel -1.
 */
export function isValidBtradeSliceMetricValue(v) {
    if (typeof v !== "number" || !Number.isFinite(v))
        return false;
    if (v === -1)
        return false;
    return true;
}
/** Предыдущий календарный день ключа среза (UTC-сутки как в хранилище). */
export function btradeSliceDateMinusDays(sliceDate, days) {
    const d = new Date(sliceDate);
    d.setUTCDate(d.getUTCDate() - days);
    return d;
}
/**
 * Forward-fill для отчётов Btrade: -1 и пропуски не обновляют carry.
 */
export function coalesceBtradeSliceItemsAlongDates(dates, getItem, initial = { lastQuantity: null, lastPrice: null }) {
    let lastQuantity = initial.lastQuantity;
    let lastPrice = initial.lastPrice;
    const out = [];
    for (const d of dates) {
        const item = getItem(d);
        const rawQ = item?.quantity;
        const rawP = item?.price;
        if (isValidBtradeSliceMetricValue(rawQ))
            lastQuantity = rawQ;
        if (isValidBtradeSliceMetricValue(rawP))
            lastPrice = rawP;
        out.push({
            quantity: lastQuantity,
            price: lastPrice,
        });
    }
    return out;
}
