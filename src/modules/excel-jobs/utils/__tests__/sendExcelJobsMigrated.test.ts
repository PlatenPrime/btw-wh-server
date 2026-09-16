import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { EXCEL_JOBS_MIGRATED_CODE } from "../../constants/excelJobConstants.js";
import {
  createMigratedExcelController,
  sendExcelJobsMigrated,
} from "../sendExcelJobsMigrated.js";

describe("sendExcelJobsMigrated", () => {
  it("responds 410 with kind", () => {
    let status = 0;
    let body: Record<string, unknown> = {};
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(data: Record<string, unknown>) {
        body = data;
        return this;
      },
    } as unknown as Response;
    sendExcelJobsMigrated(res, "grabo-skus");
    expect(status).toBe(410);
    expect(body.code).toBe(EXCEL_JOBS_MIGRATED_CODE);
    expect(body.kind).toBe("grabo-skus");
  });

  it("controller ignores request and migrates", async () => {
    const controller = createMigratedExcelController("arts-export");
    let status = 0;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json() {
        return this;
      },
    } as unknown as Response;
    await controller({} as Request, res);
    expect(status).toBe(410);
  });
});
