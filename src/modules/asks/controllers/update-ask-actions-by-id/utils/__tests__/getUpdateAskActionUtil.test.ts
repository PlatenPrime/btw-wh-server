import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));

import { getUpdateAskActionUtil } from "../getUpdateAskActionUtil.js";

describe("getUpdateAskActionUtil (update-ask-actions-by-id)", () => {
  it("формирует строку на основе user и action", () => {
    const s = getUpdateAskActionUtil({
      user: { _id: "1" as any, fullname: "User" } as any,
      action: "дія",
    });
    expect(s).toBe("2025-01-01 12:00 User: дія");
  });
});


