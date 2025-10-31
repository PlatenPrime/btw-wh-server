import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));

import { getUpdateAskActionUtil } from "../getUpdateAskActionUtil.js";

describe("getUpdateAskActionUtil (update-ask-by-id)", () => {
  it("формирует строку действия на основе solver и action", () => {
    const s = getUpdateAskActionUtil({
      solver: { _id: "1" as any, fullname: "Solver" } as any,
      action: "коментар",
    });
    expect(s).toBe("2025-01-01 12:00 Solver: коментар");
  });
});


