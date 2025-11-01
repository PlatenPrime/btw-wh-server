import { Request, Response } from "express";
import { updateRowSchema } from "./schemas/updateRowSchema.js";
import { updateRowUtil } from "./utils/updateRowUtil.js";

export const updateRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Валидация входных данных
    const parseResult = updateRowSchema.safeParse({ id, title: title || undefined });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const updatedRow = await updateRowUtil({
      id: parseResult.data.id,
      title: parseResult.data.title!,
    });

    if (!updatedRow) {
      res.status(404).json({ message: "Row not found" });
      return;
    }

    res.status(200).json(updatedRow);
  } catch (error) {
    console.error("Error updating row:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  }
};

