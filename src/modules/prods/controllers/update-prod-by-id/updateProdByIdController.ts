import { Request, Response } from "express";
import { updateProdByIdSchema } from "./schemas/updateProdByIdSchema.js";
import { updateProdByIdUtil } from "./utils/updateProdByIdUtil.js";

/**
 * @desc    Обновить производителя по id (указанные в body поля)
 * @route   PATCH /api/prods/id/:id
 */
export const updateProdByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, title, imageUrl } = req.body;
    const parseResult = updateProdByIdSchema.safeParse({ id, name, title, imageUrl });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const prod = await updateProdByIdUtil({
      id: parseResult.data.id,
      name: parseResult.data.name,
      title: parseResult.data.title,
      imageUrl: parseResult.data.imageUrl,
    });
    if (!prod) {
      res.status(404).json({ message: "Prod not found" });
      return;
    }

    res.status(200).json({
      message: "Prod updated successfully",
      data: prod,
    });
  } catch (error) {
    console.error("Error updating prod:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
