import type { Request, Response } from "express";
import { expect } from "vitest";
import {
  EXCEL_JOBS_DOCS_PATH,
  EXCEL_JOBS_MIGRATED_CODE,
  type ExcelJobKind,
} from "../constants/excelJobConstants.js";

export async function assertMigratedExcelController(
  controller: (req: Request, res: Response) => unknown,
  kind: ExcelJobKind,
): Promise<void> {
  let statusCode: number | undefined;
  let body: Record<string, unknown> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: Record<string, unknown>) {
      body = data;
      return this;
    },
  } as unknown as Response;

  await controller({} as Request, res);

  expect(statusCode).toBe(410);
  expect(body.code).toBe(EXCEL_JOBS_MIGRATED_CODE);
  expect(body.kind).toBe(kind);
  expect(body.docsPath).toBe(EXCEL_JOBS_DOCS_PATH);
}
