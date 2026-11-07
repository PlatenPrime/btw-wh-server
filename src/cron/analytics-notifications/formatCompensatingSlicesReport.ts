export type CompensatingSlicesReportStats = {
  sku: { refetched: number; updated: number };
  sliceDateLabel: string;
};

export function formatCompensatingSlicesReport(stats: CompensatingSlicesReportStats): string {
  return [
    `📊 Compensating slices — завершено (${stats.sliceDateLabel})`,
    `SKU: refetched=${stats.sku.refetched}, updated=${stats.sku.updated}`,
  ].join("\n");
}
