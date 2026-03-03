/**
 * Строит условие фильтрации по полю nameukr (регистронезависимое совпадение).
 * @param search - строка поиска
 * @returns объект для $and с $or по nameukr или null, если search пустой
 */
export function buildAnalogSearchFilter(search) {
    const trimmed = search?.trim();
    if (!trimmed)
        return null;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = { $regex: escaped, $options: "i" };
    return {
        $or: [{ nameukr: re }],
    };
}
