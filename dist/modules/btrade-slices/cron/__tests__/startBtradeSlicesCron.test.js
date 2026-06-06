import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("cron");
vi.mock("../../utils/calculateBtradeSlice.js", () => ({
    calculateBtradeSlice: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatBtradeSliceReport.js", () => ({
    formatBtradeSliceReport: vi.fn(() => "btrade report"),
}));
vi.mock("../../../../cron/analytics-notifications/formatCronReports.js", () => ({
    formatCronErrorReport: vi.fn(() => "btrade error"),
}));
import { calculateBtradeSlice } from "../../utils/calculateBtradeSlice.js";
import { startBtradeSlicesCron } from "../startBtradeSlicesCron.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
describe("startBtradeSlicesCron", () => {
    let cronCallback = null;
    const mockedCronJob = vi.mocked(CronJob);
    const mockCronInstance = { start: vi.fn(), stop: vi.fn() };
    beforeEach(() => {
        vi.clearAllMocks();
        cronCallback = null;
        mockedCronJob.mockImplementation((...args) => {
            const callbackArg = args[1];
            if (typeof callbackArg === "function") {
                cronCallback = callbackArg;
            }
            return mockCronInstance;
        });
        vi.mocked(calculateBtradeSlice).mockResolvedValue({
            saved: true,
            count: 10,
            totalArtikuls: 12,
            missing: 2,
            fromProductRests: 8,
            fromSearch: 2,
        });
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    });
    it("creates CronJob with expected schedule", () => {
        startBtradeSlicesCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 0 0 * * *", expect.any(Function), null, true, "Europe/Kiev");
    });
    it("sends analytics report after successful slice", async () => {
        startBtradeSlicesCron();
        expect(cronCallback).toBeDefined();
        if (cronCallback) {
            await cronCallback();
        }
        expect(calculateBtradeSlice).toHaveBeenCalledTimes(1);
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("btrade report");
    });
});
