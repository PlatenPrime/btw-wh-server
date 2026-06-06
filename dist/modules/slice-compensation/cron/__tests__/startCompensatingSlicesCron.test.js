import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("cron");
vi.mock("../../../utils/sliceDate.js", () => ({
    toSliceDate: vi.fn((d) => d),
}));
vi.mock("../../utils/runCompensatingAnalogSlices.js", () => ({
    runCompensatingAnalogSlices: vi.fn(),
}));
vi.mock("../../utils/runCompensatingSkuSlices.js", () => ({
    runCompensatingSkuSlices: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatCompensatingSlicesReport.js", () => ({
    formatCompensatingSlicesReport: vi.fn(() => "compensating report"),
}));
import { runCompensatingAnalogSlices } from "../../utils/runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "../../utils/runCompensatingSkuSlices.js";
import { startCompensatingSlicesCron } from "../startCompensatingSlicesCron.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
describe("startCompensatingSlicesCron", () => {
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
        vi.mocked(runCompensatingAnalogSlices).mockResolvedValue({
            refetched: 1,
            updated: 0,
        });
        vi.mocked(runCompensatingSkuSlices).mockResolvedValue({
            refetched: 2,
            updated: 1,
        });
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    });
    it("creates CronJob at 10:30 Kiev", () => {
        startCompensatingSlicesCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 30 10 * * *", expect.any(Function), null, true, "Europe/Kiev");
    });
    it("runs analog and sku compensation in parallel on tick", async () => {
        startCompensatingSlicesCron();
        expect(cronCallback).toBeDefined();
        if (cronCallback) {
            await cronCallback();
        }
        expect(runCompensatingAnalogSlices).toHaveBeenCalledTimes(1);
        expect(runCompensatingSkuSlices).toHaveBeenCalledTimes(1);
        const analogDate = vi.mocked(runCompensatingAnalogSlices).mock.calls[0][0];
        const skuDate = vi.mocked(runCompensatingSkuSlices).mock.calls[0][0];
        expect(analogDate).toBeInstanceOf(Date);
        expect(skuDate).toBeInstanceOf(Date);
        expect(analogDate.getTime()).toBe(skuDate.getTime());
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("compensating report");
    });
});
