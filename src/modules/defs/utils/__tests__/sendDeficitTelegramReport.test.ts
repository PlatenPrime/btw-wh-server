import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFICIT_REPORT_CHUNK_DELAY_MS } from "../../constants/deficitReportCron.js";

vi.mock("../../../../logging/logModuleError.js", () => ({
  logModuleError: vi.fn(),
}));
vi.mock("../../../../utils/telegram/sendMessageToDefsChat.js", () => ({
  sendMessageToDefsChat: vi.fn(),
}));

import { logModuleError } from "../../../../logging/logModuleError.js";
import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
import { sendDeficitTelegramReport } from "../sendDeficitTelegramReport.js";

describe("sendDeficitTelegramReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendMessageToDefsChat).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends each message in order", async () => {
    await sendDeficitTelegramReport(["first", "second"], 0);

    expect(sendMessageToDefsChat).toHaveBeenCalledTimes(2);
    expect(sendMessageToDefsChat).toHaveBeenNthCalledWith(1, "first");
    expect(sendMessageToDefsChat).toHaveBeenNthCalledWith(2, "second");
  });

  it("does nothing for an empty message list", async () => {
    await sendDeficitTelegramReport([]);

    expect(sendMessageToDefsChat).not.toHaveBeenCalled();
  });

  it("does not delay after the last message", async () => {
    const timeoutSpy = vi.spyOn(global, "setTimeout");

    await sendDeficitTelegramReport(["only"], 0);

    expect(sendMessageToDefsChat).toHaveBeenCalledOnce();
    expect(timeoutSpy).not.toHaveBeenCalled();
  });

  it("delays between chunks by DEFICIT_REPORT_CHUNK_DELAY_MS", async () => {
    const delayMs: number[] = [];
    vi.spyOn(global, "setTimeout").mockImplementation((fn, ms) => {
      delayMs.push(ms as number);
      (fn as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    await sendDeficitTelegramReport(["a", "b"]);

    expect(sendMessageToDefsChat).toHaveBeenCalledTimes(2);
    expect(delayMs).toEqual([DEFICIT_REPORT_CHUNK_DELAY_MS]);
  });

  it("does not throw when Telegram fails", async () => {
    vi.mocked(sendMessageToDefsChat).mockRejectedValueOnce(
      new Error("Telegram error")
    );

    await expect(
      sendDeficitTelegramReport(["first", "second"], 0)
    ).resolves.toBeUndefined();

    expect(logModuleError).toHaveBeenCalledWith(
      "defs",
      expect.any(Error),
      "Failed to send deficit report to Defs Chat:"
    );
    expect(sendMessageToDefsChat).toHaveBeenCalledTimes(1);
  });
});
