/**
 * Полный «негативный исход» в срезе: и остаток, и цена равны -1 (неактивная страница / ошибка парсера).
 */
export function isFullMinusOneSliceItem(item) {
    if (item === null || typeof item !== "object")
        return false;
    const o = item;
    return o.stock === -1 && o.price === -1;
}
