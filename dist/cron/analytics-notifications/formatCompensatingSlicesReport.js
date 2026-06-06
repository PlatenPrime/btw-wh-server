export function formatCompensatingSlicesReport(stats) {
    return [
        `📊 Compensating slices — завершено (${stats.sliceDateLabel})`,
        `Analog: refetched=${stats.analog.refetched}, updated=${stats.analog.updated}`,
        `SKU: refetched=${stats.sku.refetched}, updated=${stats.sku.updated}`,
    ].join("\n");
}
