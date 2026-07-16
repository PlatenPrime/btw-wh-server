import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logModuleError } = vi.hoisted(() => ({
  logModuleError: vi.fn(),
}));

vi.mock("../../../../../logging/logModuleError.js", () => ({
  logModuleError,
}));

vi.mock("../../../utils/runCompensatingSlicesForKonk.js", () => ({
  runCompensatingSlicesForKonk: vi.fn(),
}));

import {
  clearCompensatingRunsForTests,
  tryAcquireCompensatingRun,
} from "../../../utils/compensatingRunStatus.js";
import { runCompensatingSlicesForKonk } from "../../../utils/runCompensatingSlicesForKonk.js";
import { runCompensatingSliceController } from "../runCompensatingSliceController.js";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";

describe("runCompensatingSliceController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearCompensatingRunsForTests();
    vi.clearAllMocks();
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();
    mockReq = { body: {} };
    mockRes = {
      status: mockStatus,
      json: mockJson,
      headersSent: false,
    };
  });

  afterEach(() => {
    clearCompensatingRunsForTests();
  });

  it("400 on validation error", async () => {
    mockReq.body = {};
    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation error" })
    );
    expect(runCompensatingSlicesForKonk).not.toHaveBeenCalled();
  });

  it("409 when lock already held for konk", async () => {
    tryAcquireCompensatingRun("air");
    mockReq.body = { konkName: "air" };

    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Compensating slice already running for this competitor",
    });
    expect(runCompensatingSlicesForKonk).not.toHaveBeenCalled();
  });

  it("200 with stats and releases lock", async () => {
    vi.mocked(runCompensatingSlicesForKonk).mockResolvedValue({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 3, updated: 2 },
      sku: { refetched: 1, updated: 1 },
    });
    mockReq.body = { konkName: " AIR " };

    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );

    expect(runCompensatingSlicesForKonk).toHaveBeenCalledWith("air");
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Compensating slice completed",
      data: {
        konkName: "air",
        sliceDate: "2026-07-14",
        analog: { refetched: 3, updated: 2 },
        sku: { refetched: 1, updated: 1 },
      },
    });
    // lock released — can acquire again
    expect(tryAcquireCompensatingRun("air")).toBe(true);
  });

  it("500 on util error and releases lock", async () => {
    vi.mocked(runCompensatingSlicesForKonk).mockRejectedValue(
      new Error("boom")
    );
    mockReq.body = { konkName: "air" };

    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Failed to run compensating slice",
    });
    expect(logModuleError).toHaveBeenCalled();
    expect(tryAcquireCompensatingRun("air")).toBe(true);
  });

  it("200 создаёт audit-событие когда req.user присутствует", async () => {
    const actor = await createTestUser({ username: `actor-${Date.now()}` });
    vi.mocked(runCompensatingSlicesForKonk).mockResolvedValue({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 3, updated: 2 },
      sku: { refetched: 1, updated: 1 },
    });
    mockReq.user = { id: actor._id.toString(), role: "ADMIN" };
    mockReq.body = { konkName: "air" };

    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    const events = await Event.find({ department: "slice-compensation" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(actor._id.toString());
    expect(events[0].description).toContain("air");
  });

  it("200 не создаёт audit-событие без req.user", async () => {
    vi.mocked(runCompensatingSlicesForKonk).mockResolvedValue({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 3, updated: 2 },
      sku: { refetched: 1, updated: 1 },
    });
    mockReq.body = { konkName: "air" };

    await runCompensatingSliceController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    const events = await Event.find({ department: "slice-compensation" });
    expect(events).toHaveLength(0);
  });
});
