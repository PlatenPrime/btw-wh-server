/** Количество штук из фрагмента вида «(10шт)» / «(10 шт)» в названии товара */
export function extractPieceCountFromTitle(title) {
    if (!title) {
        return null;
    }
    const parenMatch = title.match(/\((\d+)\s*шт\.?\)/i);
    if (parenMatch?.[1]) {
        const count = parseInt(parenMatch[1], 10);
        if (Number.isFinite(count) && count > 0) {
            return count;
        }
    }
    return null;
}
