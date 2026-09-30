import type { Request, Response } from "express";
import {
  API_TASKS_DOCS_PATH,
  API_TASKS_FRONTEND_DOCS_PATH,
  API_TASKS_MIGRATED_CODE,
  type ApiTaskKind,
} from "../constants/apiTaskConstants.js";

export function buildApiTasksMigratedBody(kind: ApiTaskKind): {
  message: string;
  code: string;
  kind: ApiTaskKind;
  docsPath: string;
  frontendDocsPath: string;
} {
  return {
    message: "Action moved to POST /api/apitasks",
    code: API_TASKS_MIGRATED_CODE,
    kind,
    docsPath: API_TASKS_DOCS_PATH,
    frontendDocsPath: API_TASKS_FRONTEND_DOCS_PATH,
  };
}

export function sendApiTasksMigrated(res: Response, kind: ApiTaskKind): void {
  res.status(410).json(buildApiTasksMigratedBody(kind));
}

export function createMigratedApiTaskController(kind: ApiTaskKind) {
  return async (_req: Request, res: Response): Promise<void> => {
    sendApiTasksMigrated(res, kind);
  };
}
