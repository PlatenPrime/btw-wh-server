import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { getExcelJobController } from "../get-excel-job/getExcelJobController.js";
import { listExcelJobsController } from "../list-excel-jobs/listExcelJobsController.js";
import { cancelExcelJobController } from "../cancel-excel-job/cancelExcelJobController.js";
import { downloadExcelJobFileController } from "../download-excel-job-file/downloadExcelJobFileController.js";

function mockRes() {
  const bag: { statusCode?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      bag.statusCode = code;
      return this;
    },
    json(data: unknown) {
      bag.body = data;
      return this;
    },
    headersSent: false,
  } as unknown as Response;
  return { bag, response };
}

describe("excel-jobs controllers auth/validation", () => {
  it("get 401 without user", async () => {
    const { bag, response } = mockRes();
    await getExcelJobController({ params: { id: "x" } } as unknown as Request, response);
    expect(bag.statusCode).toBe(401);
  });

  it("list 401 without user", async () => {
    const { bag, response } = mockRes();
    await listExcelJobsController({ query: {} } as Request, response);
    expect(bag.statusCode).toBe(401);
  });

  it("cancel 401 without user", async () => {
    const { bag, response } = mockRes();
    await cancelExcelJobController({ params: { id: "x" } } as unknown as Request, response);
    expect(bag.statusCode).toBe(401);
  });

  it("download 400 without token", async () => {
    const { bag, response } = mockRes();
    await downloadExcelJobFileController(
      { params: { id: "64b0c0c0c0c0c0c0c0c0c0c0" }, query: {} } as unknown as Request,
      response,
    );
    expect(bag.statusCode).toBe(400);
  });
});
