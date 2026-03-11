import { Request, Response } from "express";
import { getAnalogSalesByDateSchema } from "./schemas/getAnalogSalesByDateSchema.js";
import { getAnalogSalesByDateUtil } from "./utils/getAnalogSalesByDateUtil.js";

/**
 * @desc    Получить продажи и выручку по аналогу на конкретную дату (для графиков)
 * @route   GET /api/analog-slices/analog/:analogId/sales-by-date?date=2026-03-01
 */
export const getAnalogSalesByDateController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = getAnalogSalesByDateSchema.safeParse({
    analogId: req.params.analogId,
    date: req.query.date,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getAnalogSalesByDateUtil(parseResult.data);
  if (!result) {
    res.status(404).json({
      message:
        "Analog not found, analog has no artikul, or no slice data for this date",
    });
    return;
  }

  res.status(200).json({
    message: "Analog sales by date retrieved successfully",
    data: result,
  });
};
