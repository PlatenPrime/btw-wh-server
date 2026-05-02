/**
 * Парсит JSON из значения HTML-атрибута; при ошибке пробует декодировать типичные entity-последовательности и повторить parse.
 */
export function parseJsonHtmlAttribute(raw) {
    if (raw === undefined || raw === "") {
        return undefined;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        const decoded = raw
            .replace(/&#34;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');
        return JSON.parse(decoded);
    }
}
