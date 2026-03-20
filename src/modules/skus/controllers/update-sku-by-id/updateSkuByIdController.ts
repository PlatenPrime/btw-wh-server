import { Request, Response } from "express";
import { updateSkuByIdSchema } from "./schemas/updateSkuByIdSchema.js";
import { updateSkuByIdUtil } from "./utils/updateSkuByIdUtil.js";

/**
 * @desc    Обновить sku по id (указанные в body поля)
 * @route   PATCH /api/skus/id/:id
 */
export const updateSkuByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { konkName, prodName, btradeAnalog, title, url } = req.body;
    const parseResult = updateSkuByIdSchema.safeParse({
      id,
      konkName,
      prodName,
      btradeAnalog,
      title,
      url,
    });

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const sku = await updateSkuByIdUtil(parseResult.data);
    if (!sku) {
      res.status(404).json({ message: "Sku not found" });
      return;
    }

    res.status(200).json({
      message: "Sku updated successfully",
      data: sku,
    });
  } catch (error) {
    console.error("Error updating sku:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
