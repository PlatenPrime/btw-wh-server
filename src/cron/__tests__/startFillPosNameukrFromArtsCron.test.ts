import { CronJob } from "cron";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cron");
vi.mock("../utils/fillPosNameukrFromArtsUtil.js", () => ({
  fillPosNameukrFromArtsUtil: vi.fn(),
}));
vi.mock("../../utils/telegram/sendMessageToPlaten.js", () => ({
  sendMessageToPlaten: vi.fn(),
}));
vi.mock("../analytics-notifications/formatCronReports.js", () => ({
  formatFillPosNameukrReport: vi.fn(() => "success report"),
  formatFillPosNameukrErrorReport: vi.fn(() => "error report"),
}));

import { fillPosNameukrFromArtsUtil } from "../utils/fillPosNameukrFromArtsUtil.js";
import { startFillPosNameukrFromArtsCron } from "../startFillPosNameukrFromArtsCron.js";
import { sendMessageToPlaten } from "../../utils/telegram/sendMessageToPlaten.js";

describe("startFillPosNameukrFromArtsCron", () => {
  let cronCallback: (() => Promise<void>) | null = null;
  const mockedCronJob = vi.mocked(CronJob);
  const mockCronInstance = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    cronCallback = null;

    mockedCronJob.mockImplementation((...args: unknown[]) => {
      const callbackArg = args[1];
      if (typeof callbackArg === "function") {
        cronCallback = callbackArg as () => Promise<void>;
      }
      return mockCronInstance as never;
    });

    vi.mocked(fillPosNameukrFromArtsUtil).mockResolvedValue({
      updatedCount: 5,
      skippedArtikulsCount: 2,
    });
    vi.mocked(sendMessageToPlaten).mockResolvedValue(undefined);
  });

  it("creates CronJob with expected schedule", () => {
    startFillPosNameukrFromArtsCron();

    expect(mockedCronJob).toHaveBeenCalledWith(
      "0 30 6 * * *",
      expect.any(Function),
      null,
      true,
      "Europe/Kiev"
    );
  });

  it("sends success notification to Platen", async () => {
    startFillPosNameukrFromArtsCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(fillPosNameukrFromArtsUtil).toHaveBeenCalledTimes(1);
    expect(sendMessageToPlaten).toHaveBeenCalledWith("success report");
  });

  it("sends error notification to Platen on failure", async () => {
    vi.mocked(fillPosNameukrFromArtsUtil).mockRejectedValue(new Error("DB fail"));

    startFillPosNameukrFromArtsCron();
    expect(cronCallback).toBeDefined();
    if (cronCallback) {
      await cronCallback();
    }

    expect(sendMessageToPlaten).toHaveBeenCalledWith("error report");
  });
});
