import type { Request, Response } from "express";
import { getArtStockExcelSchema } from "./schemas/getArtStockExcelSchema.js";
import { getArtStockExcelUtil } from "./utils/getArtStockExcelUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Excel остатков по артикулу за период
 * @route   GET /api/art-excel-reports/artikul/:artikul/stock?dateFrom=&dateTo=
 */
export const getArtStockExcelController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getArtStockExcelSchema.safeParse({
    artikul: req.params.artikul,
    dateFrom: firstQuery(req.query, "dateFrom"),
    dateTo: firstQuery(req.query, "dateTo"),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getArtStockExcelUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "Art not found for provided artikul",
    });
    return;
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.fileName}"`,
  );
  res.status(200).send(result.buffer);
};
