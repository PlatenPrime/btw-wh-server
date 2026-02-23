import { Request, Response } from "express";
import { updateKonkByIdSchema } from "./schemas/updateKonkByIdSchema.js";
import { updateKonkByIdUtil } from "./utils/updateKonkByIdUtil.js";

/**
 * @desc    Обновить конкурента по id (указанные в body поля)
 * @route   PATCH /api/konks/id/:id
 */
export const updateKonkByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, title, url, imageUrl } = req.body;
    const parseResult = updateKonkByIdSchema.safeParse({
      id,
      name,
      title,
      url,
      imageUrl,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const konk = await updateKonkByIdUtil({
      id: parseResult.data.id,
      name: parseResult.data.name,
      title: parseResult.data.title,
      url: parseResult.data.url,
      imageUrl: parseResult.data.imageUrl,
    });
    if (!konk) {
      res.status(404).json({ message: "Konk not found" });
      return;
    }

    res.status(200).json({
      message: "Konk updated successfully",
      data: konk,
    });
  } catch (error) {
    console.error("Error updating konk:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
