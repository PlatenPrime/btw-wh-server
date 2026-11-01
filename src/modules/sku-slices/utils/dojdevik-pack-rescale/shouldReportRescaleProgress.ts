export const DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY = 10;

/** Первый, последний и каждый `every`-й SKU (1-based index). */
export function shouldReportRescaleProgress(
  index: number,
  total: number,
  every: number = DOJDEVIK_PACK_RESCALE_PROGRESS_EVERY,
): boolean {
  if (index < 1 || total < 1 || every < 1) {
    return false;
  }
  if (index === 1 || index === total) {
    return true;
  }
  return index % every === 0;
}
