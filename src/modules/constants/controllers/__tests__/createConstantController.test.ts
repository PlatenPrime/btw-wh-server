import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Constant } from "../../models/Constant.js";
import { createConstantController } from "../create-constant/createConstantController.js";

describe("createConstantController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Constant.deleteMany({});
    await Event.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when name missing", async () => {
    const req = {
      body: {
        title: "Title",
        data: {},
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when name contains spaces", async () => {
    const req = {
      body: {
        name: "my key",
        title: "My Key",
        data: {},
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates constant and returns data", async () => {
    const req = {
      body: {
        name: "config",
        title: "Config",
        data: { foo: "bar" },
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { name: string }).name).toBe("config");
    const count = await Constant.countDocuments();
    expect(count).toBe(1);
  });

  it("201 creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `const-event-${Date.now()}`,
    });
    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: {
        name: "audited",
        title: "Audited",
        data: {},
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "constants" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
    expect(events[0].description).toBe(
      "Створено константу name=audited, title=Audited"
    );
  });
});
