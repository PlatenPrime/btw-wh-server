import { getServerEgressGeo } from "./getServerEgressGeo.js";

export function isServerEgressGeoLogEnabled(): boolean {
  return process.env.SERVER_EGRESS_GEO_LOG === "1";
}

/**
 * Запрашивает geo по egress IP и пишет в console (Railway logs).
 * Не бросает — сбой geo не должен ломать бизнес-операцию.
 */
export async function logServerEgressGeo(context: string): Promise<void> {
  if (!isServerEgressGeoLogEnabled()) {
    return;
  }

  try {
    const geo = await getServerEgressGeo();

    if (geo) {
      console.log(`[ServerEgressGeo] ${context}`, geo);
      return;
    }

    console.warn(`[ServerEgressGeo] ${context} failed: no geo data`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown error";
    console.warn(`[ServerEgressGeo] ${context} failed: ${message}`);
  }
}
