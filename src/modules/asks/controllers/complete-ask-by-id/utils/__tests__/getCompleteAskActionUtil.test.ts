import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));

import { getCompleteAskActionUtil } from "../getCompleteAskActionUtil.js";

describe("getCompleteAskActionUtil", () => {
  it("формирует строку действия с временем и именем исполнителя", () => {
    const action = getCompleteAskActionUtil({
      solver: { _id: "1" as any, fullname: "Solver" } as any,
    });
    expect(action).toBe("2025-01-01 12:00 Solver: ВИКОНАВ запит");
  });
});


