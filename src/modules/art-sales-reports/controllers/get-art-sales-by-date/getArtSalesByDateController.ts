import type { Request, Response } from "express";
import { getArtSalesByDateSchema } from "./schemas/getArtSalesByDateSchema.js";
import { getArtSalesByDateUtil } from "./utils/getArtSalesByDateUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Продажи и выручка по артикулу на дату
 * @route   GET /api/art-sales-reports/artikul/:artikul/by-date?date=
 */
export const getArtSalesByDateController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getArtSalesByDateSchema.safeParse({
    artikul: req.params.artikul,
    date: firstQuery(req.query, "date"),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getArtSalesByDateUtil(parseResult.data);
  if (!result) {
    res.status(404).json({
      message:
        "Art not found for provided artikul, or no slice data for this date",
    });
    return;
  }

  res.status(200).json({
    message: "Art sales by date retrieved successfully",
    data: result,
  });
};
