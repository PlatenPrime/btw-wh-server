import type { Request, Response } from "express";
import { getProdKonksPieDataSchema } from "./schemas/getProdKonksPieDataSchema.js";
import { getProdKonksPieDataUtil } from "./utils/getProdKonksPieDataUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const value = q[key];
  return Array.isArray(value) ? (value[0] as string) : (value as string | undefined);
}

/**
 * @desc    Pie по производителю: продажи всех конкурентов + Btrade в шт/грн; итог в `all`
 * @route   GET /api/sku-chart-reports/prod/konks-pie?prod=&dateFrom=&dateTo=
 */
export const getProdKonksPieDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getProdKonksPieDataSchema.safeParse({
    prod: firstQuery(q, "prod"),
    dateFrom: firstQuery(q, "dateFrom"),
    dateTo: firstQuery(q, "dateTo"),
    skugrIds: q.skugrIds,
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getProdKonksPieDataUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "No sales data found for provided prod/date range",
    });
    return;
  }

  res.status(200).json({
    message: "Prod konks pie data retrieved successfully",
    data: result.data,
    all: result.all,
  });
};
