import type { Request, Response } from "express";
import { getBtradeSliceRangeSchema } from "./schemas/getBtradeSliceRangeSchema.js";
import { getBtradeSliceRangeUtil } from "./utils/getBtradeSliceRangeUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Сырой срез Btrade по артикулу за период
 * @route   GET /api/btrade-slices/artikul/:artikul/range?dateFrom=&dateTo=
 */
export const getBtradeSliceRangeController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getBtradeSliceRangeSchema.safeParse({
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

  const result = await getBtradeSliceRangeUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({ message: "Art not found for provided artikul" });
    return;
  }

  res.status(200).json({
    message: "Btrade slice range retrieved successfully",
    data: result.data,
  });
};
