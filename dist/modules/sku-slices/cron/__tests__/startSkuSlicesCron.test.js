import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("cron");
vi.mock("../../../skus/models/Sku.js", () => ({
    Sku: {
        distinct: vi.fn(),
    },
}));
vi.mock("../../utils/runSkuSliceForKonkUtil.js", () => ({
    runSkuSliceForKonkUtil: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
    getExcludedCompetitorSet: vi.fn(),
    normalizeCompetitorName: vi.fn((value) => value.trim().toLowerCase()),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatSkuSlicesReport.js", () => ({
    formatSkuSlicesReport: vi.fn(() => "sku report"),
}));
import { Sku } from "../../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../../utils/runSkuSliceForKonkUtil.js";
import { startSkuSlicesCron } from "../startSkuSlicesCron.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
describe("startSkuSlicesCron", () => {
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
        vi.mocked(Sku.distinct).mockResolvedValue(["air", " Air ", "balun", "", "yumi"]);
        vi.mocked(runSkuSliceForKonkUtil).mockResolvedValue({
            saved: true,
            count: 1,
            total: 1,
            invalid: 0,
            errors: 0,
        });
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    });
    it("creates CronJob with expected schedule", () => {
        startSkuSlicesCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 0 20 * * *", expect.any(Function), null, true, "Europe/Kiev");
    });
    it("filters excluded competitors and removes duplicates case-insensitively", async () => {
        vi.useFakeTimers({ now: new Date("2026-04-02T17:00:00.000Z") });
        try {
            vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["yumi"]));
            startSkuSlicesCron();
            expect(cronCallback).toBeDefined();
            if (cronCallback) {
                await cronCallback();
            }
            expect(runSkuSliceForKonkUtil).toHaveBeenCalledTimes(2);
            expect(runSkuSliceForKonkUtil).toHaveBeenNthCalledWith(1, "air", expect.any(Date));
            expect(runSkuSliceForKonkUtil).toHaveBeenNthCalledWith(2, "balun", expect.any(Date));
            const d1 = vi.mocked(runSkuSliceForKonkUtil).mock.calls[0][1];
            expect(d1.toISOString()).toBe("2026-04-03T00:00:00.000Z");
            expect(sendCronAnalyticsReport).toHaveBeenCalledWith("sku report");
        }
        finally {
            vi.useRealTimers();
        }
    });
});
