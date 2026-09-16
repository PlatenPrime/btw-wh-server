export type ExcelBuildProgressHandler = (done: number, total: number) => void;

export type ExcelUtilProgressOptions = {
  onProgress?: ExcelBuildProgressHandler;
};

export function notifyExcelBuildProgress(
  onProgress: ExcelBuildProgressHandler | undefined,
  done: number,
  total: number,
): void {
  if (!onProgress) {
    return;
  }
  const safeTotal = total <= 0 ? 1 : total;
  onProgress(Math.min(done, safeTotal), safeTotal);
}
