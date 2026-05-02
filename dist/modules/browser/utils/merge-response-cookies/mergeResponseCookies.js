export function pickHeaderCaseInsensitive(headers, key) {
    const wanted = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === wanted)
            return v;
    }
    return undefined;
}
export function parseSetCookieHeader(setCookie) {
    if (Array.isArray(setCookie)) {
        return setCookie.filter((item) => typeof item === "string");
    }
    if (typeof setCookie === "string") {
        return [setCookie];
    }
    return [];
}
export function mergeCookies(existingCookieHeader, setCookie) {
    const cookieMap = new Map();
    if (existingCookieHeader.trim()) {
        const parts = existingCookieHeader.split(";");
        for (const part of parts) {
            const pair = part.trim();
            if (!pair)
                continue;
            const eq = pair.indexOf("=");
            if (eq <= 0)
                continue;
            const name = pair.slice(0, eq).trim();
            const value = pair.slice(eq + 1).trim();
            if (name)
                cookieMap.set(name, value);
        }
    }
    const setCookieRows = parseSetCookieHeader(setCookie);
    for (const row of setCookieRows) {
        const firstPart = row.split(";")[0]?.trim() ?? "";
        if (!firstPart)
            continue;
        const eq = firstPart.indexOf("=");
        if (eq <= 0)
            continue;
        const name = firstPart.slice(0, eq).trim();
        const value = firstPart.slice(eq + 1).trim();
        if (name)
            cookieMap.set(name, value);
    }
    return [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
