import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { toSkuStockBandDto } from "../../utils/toSkuStockBandDto.js";
import { deleteSkuStockBandByIdSchema } from "./schemas/deleteSkuStockBandByIdSchema.js";
import { deleteSkuStockBandByIdUtil } from "./utils/deleteSkuStockBandByIdUtil.js";

/**
 * @desc    Удалить диапазон по id
 * @route   DELETE /api/sku-stock-bands/:id
 */
export const deleteSkuStockBandByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = deleteSkuStockBandByIdSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const band = await deleteSkuStockBandByIdUtil(parseResult.data.id);
    if (!band) {
      res.status(404).json({ message: "Sku stock band not found" });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "sku-stock-bands",
        type: "delete",
        description: `Видалено діапазон остатку id=${band._id}, konk=${band.konk.name}`,
      });
    }

    res.status(200).json({
      message: "Sku stock band deleted successfully",
      data: toSkuStockBandDto(band),
    });
  } catch (error) {
    logModuleError("sku-stock-bands", error, "Error deleting sku stock band:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
