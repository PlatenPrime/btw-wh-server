/**
 * Чистые функции для расчёта продаж и выручки по дням на основе остатков.
 * Используются в Excel-отчётах сравнения продаж (getSalesComparisonExcel).
 */
/**
 * По последовательности остатков по дням возвращает для каждого дня:
 * - sales: объём продаж (разница с предыдущим днём); если нет предыдущего или остаток вырос — 0.
 * - isDeliveryDay: true, если остаток вырос по сравнению с предыдущим днём (день поставки).
 */
export function computeSalesFromStockSequence(stockByDay) {
    const result = [];
    for (let i = 0; i < stockByDay.length; i++) {
        const curr = stockByDay[i];
        const currVal = typeof curr === "number" && Number.isFinite(curr) ? curr : null;
        const prev = i > 0 ? stockByDay[i - 1] : null;
        const prevVal = typeof prev === "number" && Number.isFinite(prev) ? prev : null;
        if (prevVal === null || currVal === null) {
            result.push({ sales: 0, isDeliveryDay: false });
            continue;
        }
        if (currVal > prevVal) {
            result.push({ sales: 0, isDeliveryDay: true });
            continue;
        }
        const sales = prevVal - currVal;
        result.push({ sales, isDeliveryDay: false });
    }
    return result;
}
/**
 * Выручка за день: продажи × цена. Если цена отсутствует — 0.
 * Результат округляется до 2 знаков после запятой (деньги).
 */
export function computeRevenueForDay(sales, price) {
    const p = typeof price === "number" && Number.isFinite(price) ? price : 0;
    return Math.round(sales * p * 100) / 100;
}
