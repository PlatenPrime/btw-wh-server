/**
 * Разрешает относительный href относительно base URL (как в браузере).
 * Пустая строка, только `#` и невалидные URL дают `null`.
 */
export function resolveHrefAgainstBase(href, baseUrl) {
    const trimmed = href.trim();
    if (!trimmed || trimmed === "#") {
        return null;
    }
    try {
        return new URL(trimmed, baseUrl).toString();
    }
    catch {
        return null;
    }
}
