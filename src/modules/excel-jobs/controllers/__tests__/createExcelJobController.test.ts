import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../../constants/roles.js";
import { createExcelJobController } from "../create-excel-job/createExcelJobController.js";

function mockRes() {
  const res: {
    statusCode?: number;
    body?: Record<string, unknown>;
  } = {};
  const response = {
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(data: Record<string, unknown>) {
      res.body = data;
      return this;
    },
    headersSent: false,
  } as unknown as Response;
  return { res, response };
}

describe("createExcelJobController", () => {
  it("401 without user", async () => {
    const { res, response } = mockRes();
    await createExcelJobController({ body: { kind: "grabo-skus" } } as Request, response);
    expect(res.statusCode).toBe(401);
  });

  it("400 for invalid body", async () => {
    const { res, response } = mockRes();
    await createExcelJobController(
      {
        body: { kind: "nope" },
        user: { id: "u1", role: RoleType.ADMIN },
      } as Request,
      response,
    );
    expect(res.statusCode).toBe(400);
  });
});
