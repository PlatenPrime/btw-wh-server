/**
 * Значение годится для рядов отчётности: конечное число и не sentinel -1 (нет данных в срезе).
 */
export function isValidSkuSliceMetricValue(v) {
    if (typeof v !== "number" || !Number.isFinite(v))
        return false;
    if (v === -1)
        return false;
    return true;
}
/** Предыдущий календарный день ключа среза (UTC-сутки как в хранилище). */
export function sliceDateMinusDays(sliceDate, days) {
    const d = new Date(sliceDate);
    d.setUTCDate(d.getUTCDate() - days);
    return d;
}
/**
 * Forward-fill для отчётов: -1 и пропуски не обновляют carry; в точке дня отдаём последний валидный stock/price слева.
 */
export function coalesceSkuSliceItemsAlongDates(dates, getItem, initial = { lastStock: null, lastPrice: null }) {
    let lastStock = initial.lastStock;
    let lastPrice = initial.lastPrice;
    const out = [];
    for (const d of dates) {
        const item = getItem(d);
        const rawS = item?.stock;
        const rawP = item?.price;
        if (isValidSkuSliceMetricValue(rawS))
            lastStock = rawS;
        if (isValidSkuSliceMetricValue(rawP))
            lastPrice = rawP;
        out.push({
            stock: lastStock,
            price: lastPrice,
        });
    }
    return out;
}
