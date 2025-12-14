import { describe, expect, it } from "vitest";
import { getAsksStatisticsUtil } from "../getAsksStatisticsUtil.js";
describe("getAsksStatisticsUtil", () => {
    it("считает кол-во по статусам", () => {
        const stats = getAsksStatisticsUtil([
            { status: "new" },
            { status: "completed" },
            { status: "completed" },
            { status: "rejected" },
        ]);
        expect(stats).toEqual({
            newCount: 1,
            processingCount: 0,
            completedCount: 2,
            rejectedCount: 1,
        });
    });
});
