import type { PackFlipReviewResult } from "../../modules/sku-slices/utils/reviewPackFlipsUtil.js";

type PackFlipLineFinding = {
  productId: string;
  date: string;
  factor: number;
  title: string;
};

const SECTION_ICON = {
  patched: "🔸",
  "price-only": "💰",
  ambiguous: "⚠️",
} as const;

function formatFindingLines(
  icon: string,
  finding: PackFlipLineFinding
): string[] {
  const head = `${icon} ${finding.date} · ${finding.productId} · ×${finding.factor}`;
  const title = finding.title.trim();
  if (!title) return [head];
  return [head, `   ${title}`];
}

function formatSection(
  label: keyof typeof SECTION_ICON,
  rows: PackFlipLineFinding[]
): string[] {
  if (rows.length === 0) return [];
  const icon = SECTION_ICON[label];
  const lines = [`${label}:`];
  for (const row of rows) {
    lines.push(...formatFindingLines(icon, row));
  }
  return lines;
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
