import { Request, Response } from "express";
import { getKonkByNameSchema } from "./schemas/getKonkByNameSchema.js";
import { getKonkByNameUtil } from "./utils/getKonkByNameUtil.js";

/**
 * @desc    Получить конкурента по name
 * @route   GET /api/konks/name/:name
 */
export const getKonkByNameController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.params;
    const parseResult = getKonkByNameSchema.safeParse({ name });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const konk = await getKonkByNameUtil(parseResult.data.name);
    if (!konk) {
      res.status(404).json({ message: "Konk not found" });
      return;
    }

    res.status(200).json({
      message: "Konk retrieved successfully",
      data: konk,
    });
  } catch (error) {
    console.error("Error fetching konk by name:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
