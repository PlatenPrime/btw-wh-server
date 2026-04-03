/**
 * Случайная задержка в миллисекундах в заданном диапазоне (включительно по обоим концам),
 * чтобы размазать запросы во времени и снизить синхронные пики нагрузки.
 */
export function jitterMs(minMs, maxMs) {
    const lo = Math.min(minMs, maxMs);
    const hi = Math.max(minMs, maxMs);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
