import { describe, expect, it, vi } from "vitest";
import { GROUP_PAGES_THROTTLE_MAX_DELAY_MS, GROUP_PAGES_THROTTLE_MIN_DELAY_MS, getGroupPagesThrottleDelayMs, } from "../groupPagesThrottle.js";
describe("groupPagesThrottle", () => {
    it("returns value within default jitter range", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(getGroupPagesThrottleDelayMs()).toBe(GROUP_PAGES_THROTTLE_MIN_DELAY_MS);
        vi.spyOn(Math, "random").mockReturnValue(0.999999);
        expect(getGroupPagesThrottleDelayMs()).toBe(GROUP_PAGES_THROTTLE_MAX_DELAY_MS);
    });
    it("throws on invalid delay range", () => {
        expect(() => getGroupPagesThrottleDelayMs(0, 100)).toThrow();
        expect(() => getGroupPagesThrottleDelayMs(1200, 800)).toThrow();
    });
});
