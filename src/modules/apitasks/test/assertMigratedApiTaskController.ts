import type { Request, Response } from "express";
import { expect } from "vitest";
import {
  API_TASKS_DOCS_PATH,
  API_TASKS_MIGRATED_CODE,
  type ApiTaskKind,
} from "../constants/apiTaskConstants.js";

export async function assertMigratedApiTaskController(
  controller: (req: Request, res: Response) => unknown,
  kind: ApiTaskKind,
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
  expect(body.code).toBe(API_TASKS_MIGRATED_CODE);
  expect(body.kind).toBe(kind);
  expect(body.docsPath).toBe(API_TASKS_DOCS_PATH);
}
