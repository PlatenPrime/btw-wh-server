import { createLogger } from "../../../logging/createLogger.js";
const browserLog = createLogger({ module: "browser" });
const VALID_TRANSPORTS = new Set(["http", "playwright"]);
/**
 * Парсит `BROWSER_TRANSPORT_BY_KONK` вида `air:playwright,foo:http`.
 * Ключи — lowercase konkName; невалидный transport пропускается (warn) и не попадает в map.
 */
export function parseBrowserTransportByKonk(raw) {
    const map = new Map();
    const trimmed = raw?.trim();
    if (!trimmed) {
        return map;
    }
    for (const part of trimmed.split(",")) {
        const entry = part.trim();
        if (!entry) {
            continue;
        }
        const colonIdx = entry.indexOf(":");
        if (colonIdx <= 0) {
            browserLog.warn({ entry }, "BROWSER_TRANSPORT_BY_KONK: skip malformed entry");
            continue;
        }
        const konk = entry.slice(0, colonIdx).trim().toLowerCase();
        const transportRaw = entry.slice(colonIdx + 1).trim().toLowerCase();
        if (!konk) {
            browserLog.warn({ entry }, "BROWSER_TRANSPORT_BY_KONK: skip empty konkName");
            continue;
        }
        if (!VALID_TRANSPORTS.has(transportRaw)) {
            browserLog.warn({ entry, transport: transportRaw }, "BROWSER_TRANSPORT_BY_KONK: invalid transport, ignored");
            continue;
        }
        map.set(konk, transportRaw);
    }
    return map;
}
/**
 * Транспорт для konk: из `BROWSER_TRANSPORT_BY_KONK`, иначе `http`.
 * Без konkName или неизвестный konk — всегда `http`.
 */
export function resolveBrowserTransport(konkName) {
    const key = konkName?.trim().toLowerCase();
    if (!key) {
        return "http";
    }
    const map = parseBrowserTransportByKonk(process.env.BROWSER_TRANSPORT_BY_KONK);
    return map.get(key) ?? "http";
}
