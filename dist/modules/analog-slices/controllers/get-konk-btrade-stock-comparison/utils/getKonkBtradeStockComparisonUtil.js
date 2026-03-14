import { getKonkBtradeComparisonRangeUtil } from "../../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
export async function getKonkBtradeStockComparisonUtil(input) {
    const rangeResult = await getKonkBtradeComparisonRangeUtil(input);
    if (!rangeResult.ok) {
        return { ok: false };
    }
    const { analogs } = rangeResult;
    const dayCount = analogs[0]?.items.length ?? 0;
    if (dayCount === 0) {
        return { ok: false };
    }
    const dayCompetitorStock = new Float64Array(dayCount);
    const dayBtradeStock = new Float64Array(dayCount);
    for (const analog of analogs) {
        for (let d = 0; d < dayCount; d++) {
            dayCompetitorStock[d] += analog.items[d].analogStock ?? 0;
            dayBtradeStock[d] += analog.items[d].btradeStock ?? 0;
        }
    }
    const days = [];
    for (let d = 0; d < dayCount; d++) {
        days.push({
            date: analogs[0].items[d].date.toISOString(),
            competitorStock: dayCompetitorStock[d],
            btradeStock: dayBtradeStock[d],
        });
    }
    const firstCompetitor = dayCompetitorStock[0];
    const lastCompetitor = dayCompetitorStock[dayCount - 1];
    const firstBtrade = dayBtradeStock[0];
    const lastBtrade = dayBtradeStock[dayCount - 1];
    const diffCompetitorStock = lastCompetitor - firstCompetitor;
    const diffBtradeStock = lastBtrade - firstBtrade;
    const diffCompetitorStockPct = firstCompetitor === 0
        ? null
        : Math.round((diffCompetitorStock / firstCompetitor) * 100 * 100) / 100;
    const diffBtradeStockPct = firstBtrade === 0
        ? null
        : Math.round((diffBtradeStock / firstBtrade) * 100 * 100) / 100;
    return {
        ok: true,
        data: {
            days,
            summary: {
                firstDayCompetitorStock: firstCompetitor,
                lastDayCompetitorStock: lastCompetitor,
                firstDayBtradeStock: firstBtrade,
                lastDayBtradeStock: lastBtrade,
                diffCompetitorStock,
                diffBtradeStock,
                diffCompetitorStockPct,
                diffBtradeStockPct,
            },
        },
    };
}
