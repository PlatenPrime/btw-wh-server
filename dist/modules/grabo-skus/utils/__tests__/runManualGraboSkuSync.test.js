import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mockLogger = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
}));
vi.mock("../../../../logging/createLogger.js", () => ({
    createLogger: () => mockLogger,
}));
vi.mock("../runGraboSkuSyncUtil.js", () => ({
    runGraboSkuSyncUtil: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
    sendCronAnalyticsReport: vi.fn(),
}));
vi.mock("../../../../cron/analytics-notifications/formatGraboSkuSyncReport.js", () => ({
    formatGraboSkuSyncReport: vi.fn(() => "grabo report"),
}));
vi.mock("../../../../cron/analytics-notifications/formatCronReports.js", () => ({
    formatCronErrorReport: vi.fn(() => "grabo error"),
}));
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { clearGraboSkuSyncForTests, isGraboSkuSyncRunning, tryAcquireGraboSkuSync, } from "../graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "../runGraboSkuSyncUtil.js";
import { runManualGraboSkuSync } from "../runManualGraboSkuSync.js";
const stats = {
    categoryCount: 1,
    listed: 2,
    created: 2,
    updated: 0,
    skippedNoProductId: 0,
    errors: 0,
    markedOffSite: 0,
    catalogComplete: true,
};
describe("runManualGraboSkuSync", () => {
    beforeEach(() => {
        clearGraboSkuSyncForTests();
        vi.clearAllMocks();
    });
    afterEach(() => {
        clearGraboSkuSyncForTests();
    });
    it("warns and skips runner when lock already held", async () => {
        tryAcquireGraboSkuSync();
        await runManualGraboSkuSync();
        expect(runGraboSkuSyncUtil).not.toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalledWith("grabo sku sync already running");
        expect(isGraboSkuSyncRunning()).toBe(true);
    });
    it("runs sync, reports, and releases lock on success", async () => {
        vi.mocked(runGraboSkuSyncUtil).mockResolvedValue(stats);
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
        await runManualGraboSkuSync();
        expect(runGraboSkuSyncUtil).toHaveBeenCalledTimes(1);
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("grabo report");
        expect(mockLogger.info).toHaveBeenCalledWith("manual grabo sku sync started");
        expect(mockLogger.info).toHaveBeenCalledWith(stats, "manual grabo sku sync done");
        expect(isGraboSkuSyncRunning()).toBe(false);
    });
    it("logs error, reports, and releases lock when runner throws", async () => {
        const err = new Error("catalog down");
        vi.mocked(runGraboSkuSyncUtil).mockRejectedValue(err);
        vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
        await runManualGraboSkuSync();
        expect(mockLogger.error).toHaveBeenCalledWith({ err }, "manual grabo sku sync failed");
        expect(sendCronAnalyticsReport).toHaveBeenCalledWith("grabo error");
        expect(isGraboSkuSyncRunning()).toBe(false);
    });
});
