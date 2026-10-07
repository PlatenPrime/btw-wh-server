import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createApiTaskUtil } from "../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js";
import { postSkuSlicePostCorrectionsSchema } from "./schemas/postSkuSlicePostCorrectionsSchema.js";

/**
 * @desc    Постановка post-pass коррекций sku-slices за период (balun/svbum/pack-flip/rollup)
 * @route   POST /api/sku-slices/post-corrections/run
 */
export const postSkuSlicePostCorrectionsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id || !req.user.role) {
      res.status(401).json({
        message: "Не авторизовано: данные пользователя отсутствуют",
      });
      return;
    }

    const parseResult = postSkuSlicePostCorrectionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await createApiTaskUtil({
      kind: "sku-slices.post-corrections.run",
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
    logModuleError("sku-slices", error, "Error enqueueing post-corrections");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
