import { CronJob } from "cron";
import { createLogger } from "../../../logging/createLogger.js";
import {
  DEFICIT_REPORT_CRON_EXPR,
  DEFICIT_REPORT_CRON_TZ,
} from "../constants/deficitReportCron.js";
import {
  releaseDeficitReport,
  tryAcquireDeficitReport,
} from "../utils/deficitReportLock.js";
import { runDeficitTelegramReportUtil } from "../utils/runDeficitTelegramReportUtil.js";

export { DEFICIT_REPORT_CRON_EXPR, DEFICIT_REPORT_CRON_TZ };

const log = createLogger({ module: "defs", job: "cron" });

/**
 * Будни 09:20–17:20 Europe/Kyiv, раз в час: live-расчёт дефицитов и Telegram.
 */
export function startDeficitReportCron(): CronJob {
  const job = new CronJob(
    DEFICIT_REPORT_CRON_EXPR,
    async () => {
      if (!tryAcquireDeficitReport()) {
        log.warn("deficit report already running, skip cron tick");
        return;
      }

      try {
        const result = await runDeficitTelegramReportUtil();
        log.info({ total: result.total }, "deficit report completed");
      } catch (error) {
        log.error({ err: error }, "deficit report cron failed");
      } finally {
        releaseDeficitReport();
      }
    },
    null,
    true,
    DEFICIT_REPORT_CRON_TZ
  );

  log.info(
    { schedule: DEFICIT_REPORT_CRON_EXPR, timezone: DEFICIT_REPORT_CRON_TZ },
    "cron started"
  );
  return job;
}
