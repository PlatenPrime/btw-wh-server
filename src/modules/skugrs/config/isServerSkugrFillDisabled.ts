import { AIR_IDLE_MODE } from "../../browser/air/utils/airIdleMode.js";
import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { AIR_CLIENT_SKUGR_KONK } from "../constants/airClientSkugrFill.js";

/**
 * Серверный crawl refill группы выключен: air при AIR_IDLE_MODE.
 * Cron скидает такие группы; ручной fill-skus отвечает CLIENT_INGEST_REQUIRED.
 */
export function isServerSkugrFillDisabled(konkName: string): boolean {
  return (
    normalizeCompetitorName(konkName) === AIR_CLIENT_SKUGR_KONK &&
    AIR_IDLE_MODE
  );
}
