import type { Request, Response } from "express";
import { deleteKonkInvalidSkusParamsSchema } from "./schemas/deleteKonkInvalidSkusSchema.js";
import { deleteKonkInvalidSkusUtil } from "./utils/deleteKonkInvalidSkusUtil.js";

/**
 * @desc    Видалити всі SKU конкурента з isInvalid=true
 * @route   DELETE /api/skus/konk/:konkName/invalid
 * @access  PRIME
 */
export const deleteKonkInvalidSkusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const paramsResult = deleteKonkInvalidSkusParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: paramsResult.error.errors,
    });
    return;
  }

  const { deletedCount } = await deleteKonkInvalidSkusUtil(
    paramsResult.data.konkName,
  );

  res.status(200).json({
    message: "Invalid skus deleted",
    deletedCount,
  });
};
