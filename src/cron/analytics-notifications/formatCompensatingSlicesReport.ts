export type CompensatingSlicesReportStats = {
  analog: { refetched: number; updated: number };
  sku: { refetched: number; updated: number };
  sliceDateLabel: string;
};

export function formatCompensatingSlicesReport(
  stats: CompensatingSlicesReportStats
): string {
  return [
    `📊 Compensating slices — завершено (${stats.sliceDateLabel})`,
    `Analog: refetched=${stats.analog.refetched}, updated=${stats.analog.updated}`,
    `SKU: refetched=${stats.sku.refetched}, updated=${stats.sku.updated}`,
  ].join("\n");
}
