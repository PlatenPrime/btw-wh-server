import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../utils/kyivNightNotificationDelay.js", () => ({
    sendAnalyticsChatNotificationDeferred: vi.fn(),
}));
import { sendAnalyticsChatNotificationDeferred } from "../../../utils/kyivNightNotificationDelay.js";
import { sendCronAnalyticsReport } from "../sendCronAnalyticsReport.js";
describe("sendCronAnalyticsReport", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("delegates to sendAnalyticsChatNotificationDeferred", async () => {
        vi.mocked(sendAnalyticsChatNotificationDeferred).mockResolvedValue(undefined);
        const finishedAt = new Date("2025-06-06T10:00:00.000Z");
        await sendCronAnalyticsReport("report text", finishedAt);
        expect(sendAnalyticsChatNotificationDeferred).toHaveBeenCalledWith("report text", finishedAt);
    });
});
