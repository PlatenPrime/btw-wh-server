import type { Request, Response } from "express";
import {
  EXCEL_JOBS_DOCS_PATH,
  EXCEL_JOBS_FRONTEND_DOCS_PATH,
  EXCEL_JOBS_MIGRATED_CODE,
  type ExcelJobKind,
} from "../constants/excelJobConstants.js";

export function buildExcelJobsMigratedBody(kind: ExcelJobKind): {
  message: string;
  code: string;
  kind: ExcelJobKind;
  docsPath: string;
  frontendDocsPath: string;
} {
  return {
    message: "Excel downloads moved to POST /api/excel-jobs",
    code: EXCEL_JOBS_MIGRATED_CODE,
    kind,
    docsPath: EXCEL_JOBS_DOCS_PATH,
    frontendDocsPath: EXCEL_JOBS_FRONTEND_DOCS_PATH,
  };
}

export function sendExcelJobsMigrated(res: Response, kind: ExcelJobKind): void {
  res.status(410).json(buildExcelJobsMigratedBody(kind));
}

export function createMigratedExcelController(kind: ExcelJobKind) {
  return async (_req: Request, res: Response): Promise<void> => {
    sendExcelJobsMigrated(res, kind);
  };
}
