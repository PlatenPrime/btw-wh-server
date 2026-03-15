import type { Request, Response } from "express";
import { getKonkBtradeComparisonRangeUtil } from "../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
import { getKonkBtradeSalesComparisonExcelSchema } from "./schemas/getKonkBtradeSalesComparisonExcelSchema.js";
import { buildSalesComparisonExcel } from "./utils/buildSalesComparisonExcel.js";

/**
 * @desc    Экспорт сравнения продаж по группе аналогов (конкурент + Btrade) в Excel за период
 * @route   GET /api/analog-slices/konk-btrade/sales-comparison-excel?konk=...&prod=...&dateFrom=...&dateTo=...
 */
export const getKonkBtradeSalesComparisonExcelController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getKonkBtradeSalesComparisonExcelSchema.safeParse({
    konk: Array.isArray(q.konk) ? q.konk[0] : q.konk,
    prod: Array.isArray(q.prod) ? q.prod[0] : q.prod,
    dateFrom: Array.isArray(q.dateFrom) ? q.dateFrom[0] : q.dateFrom,
    dateTo: Array.isArray(q.dateTo) ? q.dateTo[0] : q.dateTo,
    abc: Array.isArray(q.abc) ? q.abc[0] : q.abc,
    sortBy: Array.isArray(q.sortBy) ? q.sortBy[0] : q.sortBy,
  });

  if (!parseResult.success) {
    const errors = parseResult.error.flatten();
    console.error("[getKonkBtradeSalesComparisonExcel] Validation failed:", {
      query: req.query,
      errors: errors.fieldErrors,
      formErrors: errors.formErrors,
    });
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const rangeResult = await getKonkBtradeComparisonRangeUtil(parseResult.data);
  if (!rangeResult.ok) {
    res.status(404).json({
      message: "Analogs not found for provided konk/prod",
    });
    return;
  }

  const { buffer, fileName } = await buildSalesComparisonExcel(
    rangeResult.analogs,
    {
      konk: rangeResult.konk,
      prod: rangeResult.prod,
      dateFrom: rangeResult.dateFrom,
      dateTo: rangeResult.dateTo,
    },
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  res.status(200).send(buffer);
};
