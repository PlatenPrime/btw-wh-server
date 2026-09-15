import type { PackFlipReviewResult } from "../../modules/sku-slices/utils/reviewPackFlipsUtil.js";

const SAMPLE_LIMIT = 15;

function formatSampleLine(finding: {
  productId: string;
  date: string;
  factor: number;
  title: string;
}): string {
  const title = finding.title ? ` ${finding.title}` : "";
  return `${finding.date} ${finding.productId} ×${finding.factor}${title}`;
}

function formatSection(
  label: string,
  rows: Array<{ productId: string; date: string; factor: number; title: string }>
): string[] {
  if (rows.length === 0) return [];
  const shown = rows.slice(0, SAMPLE_LIMIT).map(formatSampleLine);
  const extra = rows.length - SAMPLE_LIMIT;
  if (extra > 0) {
    shown.push(`… +${extra}`);
  }
  return [`${label}:`, ...shown];
}

export function formatPackFlipReport(result: PackFlipReviewResult): string {
  const mode = result.apply ? "applied" : "dry-run";
  const range =
    result.dates.length > 0
      ? `${result.dates[0]}…${result.dates[result.dates.length - 1]}`
      : "no-dates";

  return [
    `📊 Pack-flip ${result.konkName} — ${mode}`,
    `${result.konkName} ${range}: patched ${result.patched.length}, price-only ${result.priceOnly.length}, ambiguous ${result.ambiguous.length}`,
    ...formatSection("patched", result.patched),
    ...formatSection("price-only", result.priceOnly),
    ...formatSection("ambiguous", result.ambiguous),
  ].join("\n");
}
