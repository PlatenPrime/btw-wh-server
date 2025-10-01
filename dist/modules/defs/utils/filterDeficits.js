/**
 * Фільтрує дефіцити по правильній логіці:
 * - Критический дефицит: sharikQuant <= quant (difQuant <= 0)
 * - Лимитированный дефицит: sharikQuant <= defLimit (де defLimit = quant + artLimit)
 * @param defs - Результат з даними Sharik
 * @returns Відфільтровані дефіцити з правильно розрахованим полем defLimit
 */
export function filterDeficits(defs) {
    const filteredDefs = {};
    Object.entries(defs).forEach(([artikul, data]) => {
        const { difQuant, quant, sharikQuant, limit: artLimit } = data;
        // Рассчитываем defLimit как quant + artLimit
        const defLimit = quant + (artLimit !== undefined ? artLimit : 0);
        // Включаем в дефициты если:
        // 1. sharikQuant <= quant (критический дефицит: difQuant <= 0)
        // 2. ИЛИ sharikQuant <= defLimit (лимитированный дефицит)
        const isCriticalDeficit = sharikQuant <= quant; // difQuant <= 0
        const isLimitDeficit = sharikQuant <= defLimit && sharikQuant > quant;
        if (isCriticalDeficit || isLimitDeficit) {
            // Определяем статус дефицита
            const status = isCriticalDeficit ? "critical" : "limited";
            filteredDefs[artikul] = {
                nameukr: data.nameukr || "",
                quant,
                sharikQuant,
                difQuant,
                defLimit,
                status,
            };
        }
    });
    return filteredDefs;
}
