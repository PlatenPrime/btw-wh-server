import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));

import { getRejectAskActionUtil } from "../getRejectAskActionUtil.js";

describe("getRejectAskActionUtil", () => {
  it("формирует строку действия для отклонения", () => {
    const s = getRejectAskActionUtil({
      solver: { _id: "1" as any, fullname: "Solver" } as any,
    });
    expect(s).toBe("2025-01-01 12:00 Solver: ВІДХИЛИВ запит");
  });
});


