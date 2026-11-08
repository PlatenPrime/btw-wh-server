import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { toSkuStockBandDto } from "../../utils/toSkuStockBandDto.js";
import { createSkuStockBandSchema } from "./schemas/createSkuStockBandSchema.js";
import { createSkuStockBandUtil } from "./utils/createSkuStockBandUtil.js";

/**
 * @desc    Создать диапазон аномального остатка
 * @route   POST /api/sku-stock-bands
 */
export const createSkuStockBandController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createSkuStockBandSchema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const result = await createSkuStockBandUtil(parseResult.data);
    if (!result.ok) {
      res.status(404).json({ message: result.message });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "sku-stock-bands",
        type: "create",
        description:
          `Створено діапазон остатку id=${result.band._id}, konk=${result.band.konk.name}, ` +
          `${result.band.stockMin}–${result.band.stockMax}, normalMax=${result.band.normalMax}`,
      });
    }

    res.status(201).json({
      message: "Sku stock band created successfully",
      data: toSkuStockBandDto(result.band),
    });
  } catch (error) {
    logModuleError("sku-stock-bands", error, "Error creating sku stock band:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
