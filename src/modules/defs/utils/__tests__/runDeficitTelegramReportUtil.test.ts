import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../browser/sharik/utils/product-rests/index.js", () => ({
  clearSharikProductRestsCache: vi.fn(),
}));
vi.mock(
  "../../controllers/get-latest-defs/utils/calculateLivePogrebiDefsUtil.js",
  () => ({
    calculateLivePogrebiDefsUtil: vi.fn(),
  })
);
vi.mock("../sendDeficitTelegramReport.js", () => ({
  sendDeficitTelegramReport: vi.fn(),
}));

import { clearSharikProductRestsCache } from "../../../browser/sharik/utils/product-rests/index.js";
import { calculateLivePogrebiDefsUtil } from "../../controllers/get-latest-defs/utils/calculateLivePogrebiDefsUtil.js";
import type { ILiveDefsCalculation } from "../../types.js";
import { formatDeficitTelegramErrorMessage } from "../formatDeficitTelegramMessages.js";
import { runDeficitTelegramReportUtil } from "../runDeficitTelegramReportUtil.js";
import { sendDeficitTelegramReport } from "../sendDeficitTelegramReport.js";

function liveDefs(
  overrides: Partial<ILiveDefsCalculation> = {}
): ILiveDefsCalculation {
  return {
    result: {},
    total: 0,
    totalCriticalDefs: 0,
    totalLimitDefs: 0,
    calculatedAt: new Date("2026-08-15T09:20:00.000Z"),
    ...overrides,
  };
}

describe("runDeficitTelegramReportUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendDeficitTelegramReport).mockResolvedValue(undefined);
  });

  it("busts product_rests cache, calculates, and sends formatted messages", async () => {
    const snapshot = liveDefs({
      result: {
        A1: {
          nameukr: "Товар",
          quant: 10,
          sharikQuant: 15,
          difQuant: 5,
          defLimit: 20,
          status: "limited",
        },
      },
      total: 1,
      totalLimitDefs: 1,
    });
    vi.mocked(calculateLivePogrebiDefsUtil).mockResolvedValue(snapshot);

    const result = await runDeficitTelegramReportUtil();

    expect(clearSharikProductRestsCache).toHaveBeenCalledOnce();
    expect(calculateLivePogrebiDefsUtil).toHaveBeenCalledOnce();
    expect(sendDeficitTelegramReport).toHaveBeenCalledTimes(1);
    const messages = vi.mocked(sendDeficitTelegramReport).mock.calls[0][0];
    expect(messages[0]).toContain("Дефіцити в ліміті");
    expect(messages[0]).toContain("A1: 5");
    expect(messages.at(-1)).toContain("Всього дефіцитів: 1");
    expect(result).toBe(snapshot);
  });

  it("sends empty-state message when calculation has no deficits", async () => {
    vi.mocked(calculateLivePogrebiDefsUtil).mockResolvedValue(liveDefs());

    await runDeficitTelegramReportUtil();

    expect(sendDeficitTelegramReport).toHaveBeenCalledWith([
      "🎉 Відмінно!\nДефіцитів не знайдено\nВсі артикули в нормі",
    ]);
  });

  it("sends error message to chat and rethrows when calculation fails", async () => {
    const error = new Error("calc failed");
    vi.mocked(calculateLivePogrebiDefsUtil).mockRejectedValue(error);

    await expect(runDeficitTelegramReportUtil()).rejects.toThrow("calc failed");

    expect(clearSharikProductRestsCache).toHaveBeenCalledOnce();
    expect(sendDeficitTelegramReport).toHaveBeenCalledWith([
      formatDeficitTelegramErrorMessage(error),
    ]);
  });
});
