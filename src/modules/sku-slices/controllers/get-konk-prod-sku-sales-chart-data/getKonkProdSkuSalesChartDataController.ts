import type { Request, Response } from "express";
import { getKonkProdSkuSalesChartDataSchema } from "./schemas/getKonkProdSkuSalesChartDataSchema.js";
import { getKonkProdSkuSalesChartDataUtil } from "./utils/getKonkProdSkuSalesChartDataUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Данные для графика продаж/выручки: сумма SKU конкурента vs Btrade по производителю
 * @route   GET /api/sku-slices/konk-prod/sales-chart-data?konk=&prod=&dateFrom=&dateTo=
 */
export const getKonkProdSkuSalesChartDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getKonkProdSkuSalesChartDataSchema.safeParse({
    konk: firstQuery(q, "konk"),
    prod: firstQuery(q, "prod"),
    dateFrom: firstQuery(q, "dateFrom"),
    dateTo: firstQuery(q, "dateTo"),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getKonkProdSkuSalesChartDataUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message:
        "No skus found for provided konk/prod, or no sku with productId in group",
    });
    return;
  }

  res.status(200).json({
    message: "Konk/prod SKU sales chart data retrieved successfully",
    data: result.data,
  });
};
