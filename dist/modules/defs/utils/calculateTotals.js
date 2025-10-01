/**
 * Рассчитывает итоговые значения для дефицитов используя поле status:
 * - Критический дефицит: status === 'critical'
 * - Лимитированный дефицит: status === 'limited'
 * @param result - Результат расчета дефицитов
 * @returns Объект с итоговыми значениями
 */
export function calculateDeficitTotals(result) {
    let total = 0;
    let totalCriticalDefs = 0;
    let totalLimitDefs = 0;
    Object.values(result).forEach((item) => {
        total++;
        // Используем поле status для определения типа дефицита
        if (item.status === "critical") {
            totalCriticalDefs++;
        }
        else if (item.status === "limited") {
            totalLimitDefs++;
        }
    });
    return {
        total,
        totalCriticalDefs,
        totalLimitDefs,
    };
}
