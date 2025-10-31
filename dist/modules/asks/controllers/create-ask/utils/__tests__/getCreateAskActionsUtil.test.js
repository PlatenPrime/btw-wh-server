import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
    getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));
import { getCreateAskActionsUtil } from "../getCreateAskActionsUtil.js";
describe("getCreateAskActionsUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("возвращает одно действие с корректными данными", () => {
        const actionList = getCreateAskActionsUtil({
            askerData: { _id: "1", fullname: "Test User" },
            nameukr: "Папір А4",
            quant: 5,
            com: "терміново",
        });
        expect(actionList).toHaveLength(1);
        const action = actionList[0];
        expect(action).toContain("2025-01-01 12:00");
        expect(action).toContain("Test User");
        expect(action).toContain("Папір А4");
        expect(action).toContain("5");
        expect(action).toContain("терміново");
    });
});
