import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { createRowSchema } from "./schemas/createRowSchema.js";
import { createRowUtil } from "./utils/createRowUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

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

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "rows",
        type: "create",
        description: `Створено ряд ${createdRow.title}`,
      });
    }

    res.status(201).json(createdRow);
  } catch (error) {
    logModuleError("rows", error, "Error creating row:");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  }
};
