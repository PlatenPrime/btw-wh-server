/**
 * Нормализует URL для сравнения sourceUrl и Sku.url:
 * trim, без hash, без завершающего слэша у pathname.
 */
export function normalizeComparableUrl(raw) {
    const u = new URL(raw.trim());
    u.hash = "";
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
    }
    u.pathname = path;
    return u.href;
}
/**
 * true если оба URL указывают на один и тот же ресурс после нормализации.
 */
export function urlsMatchForClientIngest(left, right) {
    try {
        return normalizeComparableUrl(left) === normalizeComparableUrl(right);
    }
    catch {
        return false;
    }
}
