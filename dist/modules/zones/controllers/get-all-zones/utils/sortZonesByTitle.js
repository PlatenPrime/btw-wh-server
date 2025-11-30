/**
 * Сортирует зоны по title с числовым сравнением сегментов
 * Корректно обрабатывает зоны с разным количеством сегментов
 * @param zones - Массив зон для сортировки (мутирует массив)
 * @param sortOrder - Направление сортировки: 'asc' или 'desc' (по умолчанию 'asc')
 * @returns Отсортированный массив зон
 * @example
 * sortZonesByTitle([{title: "42-11-2"}, {title: "42-8-1"}], "asc")
 * // [{title: "42-8-1"}, {title: "42-11-2"}] - 8 < 11
 */
export function sortZonesByTitle(zones, sortOrder = "asc") {
    return zones.sort((a, b) => {
        const partsA = a.title.split("-");
        const partsB = b.title.split("-");
        // Определяем максимальную длину для корректного сравнения
        const maxLength = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < maxLength; i++) {
            // Если у одной зоны закончились сегменты, считаем недостающие как 0
            const numA = i < partsA.length ? parseInt(partsA[i], 10) : 0;
            const numB = i < partsB.length ? parseInt(partsB[i], 10) : 0;
            if (numA < numB) {
                return sortOrder === "asc" ? -1 : 1;
            }
            if (numA > numB) {
                return sortOrder === "asc" ? 1 : -1;
            }
        }
        return 0;
    });
}
