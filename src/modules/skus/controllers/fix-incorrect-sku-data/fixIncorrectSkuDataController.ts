import { Request, Response } from "express";
import { fixIncorrectSkuDataSchema } from "./schemas/fixIncorrectSkuDataSchema.js";
import { fixIncorrectSkuDataUtil } from "./utils/fixIncorrectSkuDataUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Массово исправить поля у SKU, попавших под filter
 * @route   POST /api/skus/fix-incorrect-sku-data
 */
export const fixIncorrectSkuDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = fixIncorrectSkuDataSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await fixIncorrectSkuDataUtil(parseResult.data);

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "skus",
        type: "other",
        description: `Масово виправлено дані sku: знайдено ${result.matchedCount}, змінено ${result.modifiedCount} шт.`,
      });
    }

    res.status(200).json({
      message: "Sku data fixed successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logModuleError("skus", error, "Error fixing sku data:");

    if (error instanceof Error && error.name === "MongoServerError") {
      const mongoError = error as Error & {
        code?: number;
        keyPattern?: Record<string, number>;
      };
      if (mongoError.code === 11000) {
        const duplicateField = mongoError.keyPattern
          ? Object.keys(mongoError.keyPattern)[0]
          : "field";
        res.status(409).json({
          message: `Duplicate value violates unique index on ${duplicateField}`,
        });
        return;
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
