import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("cron");
vi.mock("../../utils/runSkuInvalidFlagSync.js", () => ({
    runSkuInvalidFlagSync: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatSkuInvalidFlagReport.js", () => ({
    formatSkuInvalidFlagReport: vi.fn(() => "invalid report"),
}));
import { runSkuInvalidFlagSync } from "../../utils/runSkuInvalidFlagSync.js";
import { startSkuInvalidFlagCron } from "../startSkuInvalidFlagCron.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
describe("startSkuInvalidFlagCron", () => {
    let cronCallback = null;
    const mockedCronJob = vi.mocked(CronJob);
    const mockCronInstance = { start: vi.fn(), stop: vi.fn() };
    beforeEach(() => {
        vi.clearAllMocks();
        cronCallback = null;
        mockedCronJob.mockImplementation((...args) => {
            const cb = args[1];
            if (typeof cb === "function") {
                cronCallback = cb;
            }
            return mockCronInstance;
        });
        vi.mocked(runSkuInvalidFlagSync).mockResolvedValue({
            updated: 3,
            konkCount: 1,
        });
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    });
    it("schedules weekly Sunday 14:00 Kyiv", () => {
        startSkuInvalidFlagCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 0 14 * * 0", expect.any(Function), null, true, "Europe/Kyiv");
    });
    it("runs runSkuInvalidFlagSync on tick", async () => {
        startSkuInvalidFlagCron();
        expect(cronCallback).toBeDefined();
        if (cronCallback)
            await cronCallback();
        expect(runSkuInvalidFlagSync).toHaveBeenCalledTimes(1);
        expect(vi.mocked(runSkuInvalidFlagSync).mock.calls[0][0]).toBeInstanceOf(Date);
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("invalid report");
    });
});
