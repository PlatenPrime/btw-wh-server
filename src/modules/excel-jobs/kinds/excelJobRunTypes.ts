import type { ExcelBuildProgressHandler } from "../../../lib/excel/excelBuildProgress.js";
import type { ExcelJobKind } from "../constants/excelJobConstants.js";

export type ExcelJobRunResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false; error: string };

export type ExcelJobRunOptions = {
  onProgress?: ExcelBuildProgressHandler;
};

export type ExcelJobKindRunner = (
  params: unknown,
  options?: ExcelJobRunOptions,
) => Promise<ExcelJobRunResult>;

export function failExcelJobRun(error: string): ExcelJobRunResult {
  return { ok: false, error };
}

export function okExcelJobRun(
  buffer: Buffer,
  fileName: string,
): ExcelJobRunResult {
  return { ok: true, buffer, fileName };
}

export function assertKind(_kind: ExcelJobKind): void {
  // marker for exhaustive switches in tests
}
