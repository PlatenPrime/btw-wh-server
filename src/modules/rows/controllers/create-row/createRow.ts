import { Request, Response } from "express";
import { createRowSchema } from "./schemas/createRowSchema.js";
import { createRowUtil } from "./utils/createRowUtil.js";

export const createRow = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    // Валидация входных данных
    const parseResult = createRowSchema.safeParse({ title });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const createdRow = await createRowUtil({ title: parseResult.data.title });

    res.status(201).json(createdRow);
  } catch (error) {
    console.error("Error creating row:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  }
};
