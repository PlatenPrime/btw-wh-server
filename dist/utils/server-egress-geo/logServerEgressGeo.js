import { getServerEgressGeo } from "./getServerEgressGeo.js";
const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);
export function isServerEgressGeoLogEnabled() {
    const raw = process.env.SERVER_EGRESS_GEO_LOG?.trim().toLowerCase();
    if (!raw) {
        return true;
    }
    if (DISABLED_VALUES.has(raw)) {
        return false;
    }
    return true;
}
/**
 * Запрашивает geo по egress IP и пишет в console (Railway logs).
 * По умолчанию включено; отключение: SERVER_EGRESS_GEO_LOG=0|false|no|off.
 * Не бросает — сбой geo не должен ломать бизнес-операцию.
 */
export async function logServerEgressGeo(context) {
    if (!isServerEgressGeoLogEnabled()) {
        return;
    }
    try {
        const geo = await getServerEgressGeo();
        if (geo) {
            console.log(`[ServerEgressGeo] ${context} ${JSON.stringify(geo)}`);
            return;
        }
        console.warn(`[ServerEgressGeo] ${context} failed: no geo data`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        console.warn(`[ServerEgressGeo] ${context} failed: ${message}`);
    }
}
