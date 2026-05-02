/**
 * Парсит строку как JSON-объект (не массив, не null).
 * Пустая строка и невалидный JSON дают `null`.
 */
export function tryParseJsonRecord(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
