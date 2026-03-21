import { Request, Response } from "express";
import { toSkugrDto } from "../../utils/toSkugrDto.js";
import { createSkugrSchema } from "./schemas/createSkugrSchema.js";
import {
  InvalidSkuReferencesError,
  createSkugrUtil,
} from "./utils/createSkugrUtil.js";

/**
 * @desc    Создать группу товаров конкурента (skugr)
 * @route   POST /api/skugrs
 */
export const createSkugrController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = createSkugrSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const skugr = await createSkugrUtil(parseResult.data);

    res.status(201).json({
      message: "Skugr created successfully",
      data: toSkugrDto(skugr),
    });
  } catch (error) {
    if (error instanceof InvalidSkuReferencesError) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error("Error creating skugr:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
