import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("cron");
vi.mock("../../utils/calculateAnalogSlice.js", () => ({
    ANALOG_SLICE_KONK_NAMES: ["air", "balun", "sharte", "yumi", "yumin"],
    calculateAnalogSlice: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
    getExcludedCompetitorSet: vi.fn(),
    normalizeCompetitorName: vi.fn((value) => value.trim().toLowerCase()),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatAnalogSlicesReport.js", () => ({
    formatAnalogSlicesReport: vi.fn(() => "analog report"),
}));
vi.mock("../../../../cron/analytics-notifications/formatCronReports.js", () => ({
    formatCronErrorReport: vi.fn(() => "analog error"),
}));
import { calculateAnalogSlice } from "../../utils/calculateAnalogSlice.js";
import { startAnalogSlicesCron } from "../startAnalogSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { formatAnalogSlicesReport } from "../../../../cron/analytics-notifications/formatAnalogSlicesReport.js";
const sliceResult = {
    saved: true,
    count: 1,
    total: 1,
    invalid: 0,
    errors: 0,
};
describe("startAnalogSlicesCron", () => {
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
        vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set());
        vi.mocked(calculateAnalogSlice).mockImplementation(async (konkName) => ({
            ...sliceResult,
            count: konkName === "air"
                ? 1
                : konkName === "balun"
                    ? 2
                    : konkName === "sharte"
                        ? 3
                        : konkName === "yumi"
                            ? 4
                            : 5,
        }));
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    });
    it("creates CronJob with expected schedule", () => {
        startAnalogSlicesCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 0 4 * * *", expect.any(Function), null, true, "Europe/Kiev");
    });
    it("does not run excluded competitors", async () => {
        vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["balun", "yumi"]));
        startAnalogSlicesCron();
        expect(cronCallback).toBeDefined();
        if (cronCallback) {
            await cronCallback();
        }
        expect(calculateAnalogSlice).toHaveBeenCalledTimes(3);
        expect(calculateAnalogSlice).toHaveBeenCalledWith("air");
        expect(calculateAnalogSlice).toHaveBeenCalledWith("sharte");
        expect(calculateAnalogSlice).toHaveBeenCalledWith("yumin");
        expect(calculateAnalogSlice).not.toHaveBeenCalledWith("balun");
        expect(calculateAnalogSlice).not.toHaveBeenCalledWith("yumi");
        expect(formatAnalogSlicesReport).toHaveBeenCalled();
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("analog report");
    });
});
