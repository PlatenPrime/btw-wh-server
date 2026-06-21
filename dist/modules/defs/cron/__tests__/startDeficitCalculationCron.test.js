import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as calcUtil from "../../controllers/calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";
import { startDeficitCalculationCron } from "../startDeficitCalculationCron.js";
const mockLogger = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
}));
vi.mock("cron");
vi.mock("../../../../logging/createLogger.js", () => ({
    createLogger: () => mockLogger,
}));
describe("startDeficitCalculationCron", () => {
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
        vi.spyOn(calcUtil, "calculateAndSavePogrebiDefsUtil").mockResolvedValue({
            total: 5,
            totalCriticalDefs: 2,
            totalLimitDefs: 3,
        });
    });
    it("creates CronJob with expected schedule and timezone", () => {
        startDeficitCalculationCron();
        expect(mockedCronJob).toHaveBeenCalledWith("0 0 8-17 * * 1-5", expect.any(Function), null, true, "Europe/Kiev");
    });
    it("runs deficit calculation on cron tick", async () => {
        startDeficitCalculationCron();
        expect(cronCallback).toBeDefined();
        if (cronCallback) {
            await cronCallback();
        }
        expect(calcUtil.calculateAndSavePogrebiDefsUtil).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith("calculating deficits");
        expect(mockLogger.info).toHaveBeenCalledWith({ total: 5 }, "deficit calculation completed");
    });
    it("logs error when calculation fails", async () => {
        vi.spyOn(calcUtil, "calculateAndSavePogrebiDefsUtil").mockRejectedValue(new Error("calc failed"));
        startDeficitCalculationCron();
        if (cronCallback) {
            await cronCallback();
        }
        expect(mockLogger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "deficit calculation cron failed");
    });
});
