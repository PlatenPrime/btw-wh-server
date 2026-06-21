import { getServerEgressGeo } from "./getServerEgressGeo.js";
import { createLogger } from "../../logging/createLogger.js";

const log = createLogger({ module: "server-egress-geo" });

const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

export function isServerEgressGeoLogEnabled(): boolean {
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
 * Запрашивает geo по egress IP и пишет в structured log (Railway logs).
 * По умолчанию включено; отключение: SERVER_EGRESS_GEO_LOG=0|false|no|off.
 * Не бросает — сбой geo не должен ломать бизнес-операцию.
 */
export async function logServerEgressGeo(context: string): Promise<void> {
  if (!isServerEgressGeoLogEnabled()) {
    return;
  }

  try {
    const geo = await getServerEgressGeo();

    if (geo) {
      log.info({ context, geo }, "server egress geo");
      return;
    }

    log.warn({ context }, "server egress geo unavailable");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown error";
    log.warn({ context, err: message }, "server egress geo failed");
  }
}
