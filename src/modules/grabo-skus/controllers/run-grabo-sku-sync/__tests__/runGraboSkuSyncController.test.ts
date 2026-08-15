import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendCronAnalyticsReport } from "../../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { logModuleError } from "../../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../../events/utils/createEventUtil.js";
import {
  clearGraboSkuSyncForTests,
  tryAcquireGraboSkuSync,
} from "../../../utils/graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "../../../utils/runGraboSkuSyncUtil.js";
import { runGraboSkuSyncController } from "../runGraboSkuSyncController.js";

vi.mock("../../../utils/runGraboSkuSyncUtil.js", () => ({
  runGraboSkuSyncUtil: vi.fn(),
}));

vi.mock("../../../../../cron/analytics-notifications/sendCronAnalyticsReport.js", () => ({
  sendCronAnalyticsReport: vi.fn(),
}));

vi.mock("../../../../events/utils/createEventUtil.js", () => ({
  createEventUtil: vi.fn(),
}));

vi.mock("../../../../../logging/logModuleError.js", () => ({
  logModuleError: vi.fn(),
}));

const emptyStats = {
  categoryCount: 1,
  listed: 2,
  created: 1,
  updated: 1,
  skippedNoProductId: 0,
  errors: 0,
  markedOffSite: 0,
  catalogComplete: true,
};

describe("runGraboSkuSyncController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearGraboSkuSyncForTests();
    vi.clearAllMocks();
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();
    mockReq = { user: { id: "user-1", role: "ADMIN" } };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    vi.mocked(runGraboSkuSyncUtil).mockResolvedValue(emptyStats);
    vi.mocked(sendCronAnalyticsReport).mockResolvedValue(undefined);
    vi.mocked(createEventUtil).mockResolvedValue(null);
  });

  afterEach(() => {
    clearGraboSkuSyncForTests();
  });

  it("409 when sync already running", async () => {
    tryAcquireGraboSkuSync();
    await runGraboSkuSyncController(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Grabo SKU sync already running",
    });
    expect(runGraboSkuSyncUtil).not.toHaveBeenCalled();
  });

  it("202 and runs sync in background", async () => {
    await runGraboSkuSyncController(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(202);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Grabo SKU sync accepted",
      data: { accepted: true },
    });

    await vi.waitFor(() => {
      expect(runGraboSkuSyncUtil).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(sendCronAnalyticsReport).toHaveBeenCalled();
    });
    expect(createEventUtil).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        department: "grabo-skus",
        type: "other",
      })
    );
  });

  it("releases lock and reports when background sync throws", async () => {
    vi.mocked(runGraboSkuSyncUtil).mockRejectedValue(new Error("sync boom"));

    await runGraboSkuSyncController(mockReq as Request, mockRes as Response);

    await vi.waitFor(() => {
      expect(sendCronAnalyticsReport).toHaveBeenCalled();
    });
    expect(logModuleError).toHaveBeenCalled();
    expect(tryAcquireGraboSkuSync()).toBe(true);
  });
});
