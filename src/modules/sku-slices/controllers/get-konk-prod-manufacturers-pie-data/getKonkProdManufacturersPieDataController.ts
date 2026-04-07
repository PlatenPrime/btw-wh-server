import type { Request, Response } from "express";
import { getKonkProdManufacturersPieDataSchema } from "./schemas/getKonkProdManufacturersPieDataSchema.js";
import { getKonkProdManufacturersPieDataUtil } from "./utils/getKonkProdManufacturersPieDataUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const value = q[key];
  return Array.isArray(value) ? (value[0] as string) : (value as string | undefined);
}

/**
 * @desc    Данные для pie диаграммы конкурента: продажи в шт/грн по производителям
 * @route   GET /api/sku-slices/konk-prod/manufacturers-pie-data?konk=&dateFrom=&dateTo=
 */
export const getKonkProdManufacturersPieDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getKonkProdManufacturersPieDataSchema.safeParse({
    konk: firstQuery(q, "konk"),
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

  const result = await getKonkProdManufacturersPieDataUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "No sku sales data found for provided konk/date range",
    });
    return;
  }

  res.status(200).json({
    message: "Konk manufacturers pie data retrieved successfully",
    data: result.data,
  });
};
