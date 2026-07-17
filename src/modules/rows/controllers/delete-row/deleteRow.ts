import { Request, Response } from "express";
import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { deleteRowSchema } from "./schemas/deleteRowSchema.js";
import { deleteRowUtil } from "./utils/deleteRowUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { Row } from "../../models/Row.js";

export const deleteRow = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    // Валидация входных данных
    const parseResult = deleteRowSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    let rowExists: boolean = false;
    let rowTitle: string | undefined;

    await session.withTransaction(async () => {
      const row = await Row.findById(parseResult.data.id).session(session);
      rowTitle = row?.title;

      rowExists = await deleteRowUtil({ id: parseResult.data.id, session });
    });

    if (!rowExists) {
      res.status(404).json({ message: "Row not found" });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "rows",
        type: "delete",
        description: `Видалено ряд ${rowTitle ?? parseResult.data.id} разом з пов'язаними паллетами та позиціями`,
      });
    }

    res.status(200).json({ message: "Row and related pallets and positions deleted" });
  } catch (error) {
    logModuleError("rows", error, "Error deleting row:");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  } finally {
    await session.endSession();
  }
};

