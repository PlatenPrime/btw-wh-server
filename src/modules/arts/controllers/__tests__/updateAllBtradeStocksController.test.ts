import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import * as updateAllUtil from "../../utils/updateAllBtradeStocksUtil.js";
import { updateAllBtradeStocksController } from "../update-all-btrade-stocks/updateAllBtradeStocksController.js";

describe("updateAllBtradeStocksController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
    vi.clearAllMocks();
  });

  it("202: запускает фоновое обновление btradeStock", async () => {
    vi.spyOn(updateAllUtil, "updateAllBtradeStocksUtil").mockResolvedValue({
      total: 2,
      updated: 2,
      errors: 0,
      notFound: 0,
    });

    const req = {} as Request;

    await updateAllBtradeStocksController(req, res);

    expect(responseStatus.code).toBe(202);
    expect(responseJson.message).toBe("BtradeStock update process started");
    expect(updateAllUtil.updateAllBtradeStocksUtil).toHaveBeenCalled();
  });

  it("202: создаёт audit event после завершения фонового обновления, когда req.user присутствует", async () => {
    const user = await createTestUser({ username: `btrade-all-event-${Date.now()}` });
    vi.spyOn(updateAllUtil, "updateAllBtradeStocksUtil").mockResolvedValue({
      total: 2,
      updated: 2,
      errors: 0,
      notFound: 0,
    });

    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;

    await updateAllBtradeStocksController(req, res);
    expect(responseStatus.code).toBe(202);

    // Ждём завершения фонового промиса, который создаёт audit event
    await new Promise((resolve) => setTimeout(resolve, 0));

    const events = await Event.find({ department: "arts" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
