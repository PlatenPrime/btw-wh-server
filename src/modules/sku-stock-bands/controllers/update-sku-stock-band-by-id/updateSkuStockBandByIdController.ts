import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { toSkuStockBandDto } from "../../utils/toSkuStockBandDto.js";
import { updateSkuStockBandByIdSchema } from "./schemas/updateSkuStockBandByIdSchema.js";
import { updateSkuStockBandByIdUtil } from "./utils/updateSkuStockBandByIdUtil.js";

/**
 * @desc    Обновить диапазон по id
 * @route   PATCH /api/sku-stock-bands/:id
 */
export const updateSkuStockBandByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = updateSkuStockBandByIdSchema.safeParse({
      id: req.params.id,
      ...(req.body ?? {}),
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const result = await updateSkuStockBandByIdUtil(parseResult.data);
    if (!result.ok) {
      const status = result.code === "INVALID_BOUNDS" ? 400 : 404;
      res.status(status).json({ message: result.message });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "sku-stock-bands",
        type: "edit",
        description:
          `Оновлено діапазон остатку id=${result.band._id}, konk=${result.band.konk.name}, ` +
          `${result.band.stockMin}–${result.band.stockMax}, normalMax=${result.band.normalMax}`,
      });
    }

    res.status(200).json({
      message: "Sku stock band updated successfully",
      data: toSkuStockBandDto(result.band),
    });
  } catch (error) {
    logModuleError("sku-stock-bands", error, "Error updating sku stock band:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
