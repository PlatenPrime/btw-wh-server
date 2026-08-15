import { describe, expect, it } from "vitest";
import { DEFICIT_REPORT_CHUNK_DELAY_MS, DEFICIT_REPORT_CHUNK_SIZE, DEFICIT_REPORT_CRON_EXPR, DEFICIT_REPORT_CRON_TZ, } from "../deficitReportCron.js";
describe("deficitReportCron constants", () => {
    it("schedules weekdays 09:20-17:20 Kyiv hourly", () => {
        expect(DEFICIT_REPORT_CRON_EXPR).toBe("0 20 9-17 * * 1-5");
        expect(DEFICIT_REPORT_CRON_TZ).toBe("Europe/Kyiv");
    });
    it("chunks telegram messages with delay between them", () => {
        expect(DEFICIT_REPORT_CHUNK_SIZE).toBe(20);
        expect(DEFICIT_REPORT_CHUNK_DELAY_MS).toBe(500);
    });
});
