/**
 * Короткий снимок HTML для логов, когда парсер air вернул -1/-1.
 */
export function summarizeAirHtmlForLog(html) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = (titleMatch?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    const snippet = html.replace(/\s+/g, " ").trim().slice(0, 160);
    return { title, snippet, htmlLength: html.length };
}
