import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createApiTaskUtil } from "../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js";
import { batchCorrectStockBandSchema } from "./schemas/batchCorrectStockBandSchema.js";

/**
 * @desc    Batch RTL-correct по сохранённому диапазону (ApiTask)
 * @route   POST /api/sku-slices/stock-bands/:bandId/batch-correct
 */
export const batchCorrectStockBandController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id || !req.user.role) {
      res.status(401).json({
        message: "Не авторизовано: дані користувача відсутні",
      });
      return;
    }

    const parseResult = batchCorrectStockBandSchema.safeParse({
      bandId: req.params.bandId,
      ...(req.body ?? {}),
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const result = await createApiTaskUtil({
      kind: "sku-slices.stock-band.batch-correct",
      params: parseResult.data as Record<string, unknown>,
      userId: req.user.id,
      userRole: req.user.role,
    });

    if (!result.ok) {
      res.status(result.status).json({
        message: result.message,
        ...("errors" in result && result.errors ? { errors: result.errors } : {}),
      });
      return;
    }

    res.status(202).json({
      message: "Api task accepted",
      data: result.data,
    });
  } catch (error) {
    logModuleError("sku-slices", error, "Error enqueueing stock-band batch-correct");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
