import {
  computeArtSalesPointsFromSeries,
  loadArtBtradeSliceSeries,
} from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
import type { GetArtStockChartDataInput } from "../../get-art-stock-chart-data/schemas/getArtStockChartDataSchema.js";

export type ArtSalesChartData = {
  days: Array<{
    date: string;
    sales: number;
    revenue: number;
    price: number;
    isDeliveryDay: boolean;
  }>;
  summary: {
    totalSales: number;
    totalRevenue: number;
  };
};

export type GetArtSalesChartDataResult =
  | { ok: true; data: ArtSalesChartData }
  | { ok: false };

export async function getArtSalesChartDataUtil(
  input: GetArtStockChartDataInput,
): Promise<GetArtSalesChartDataResult> {
  const loaded = await loadArtBtradeSliceSeries({
    artikul: input.artikul,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });
  if (!loaded.ok) return { ok: false };

  const dayCount = loaded.datesReport.length;
  if (dayCount === 0) return { ok: false };

  let totalSales = 0;
  let totalRevenue = 0;

  const salesPoints = computeArtSalesPointsFromSeries(
    loaded.datesReport,
    loaded.coalescedFull,
    loaded.reportIndexStart,
  );

  const days = salesPoints.map((point) => {
    totalSales += point.sales;
    totalRevenue += point.revenue;
    return {
      date: point.date,
      sales: point.sales,
      revenue: Math.round(point.revenue * 100) / 100,
      price: point.price,
      isDeliveryDay: point.isDeliveryDay,
    };
  });

  totalRevenue = Math.round(totalRevenue * 100) / 100;

  return {
    ok: true,
    data: {
      days,
      summary: {
        totalSales,
        totalRevenue,
      },
    },
  };
}
