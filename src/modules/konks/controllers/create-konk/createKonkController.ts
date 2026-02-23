import { Request, Response } from "express";
import { createKonkSchema } from "./schemas/createKonkSchema.js";
import { createKonkUtil } from "./utils/createKonkUtil.js";

/**
 * @desc    Создать конкурента
 * @route   POST /api/konks
 */
export const createKonkController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = createKonkSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const konk = await createKonkUtil({
      name: parseResult.data.name,
      title: parseResult.data.title,
      url: parseResult.data.url,
      imageUrl: parseResult.data.imageUrl,
    });

    res.status(201).json({
      message: "Konk created successfully",
      data: konk,
    });
  } catch (error) {
    console.error("Error creating konk:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
