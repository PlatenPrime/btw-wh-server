import { Request, Response } from "express";
import mongoose from "mongoose";
import { deleteRowSchema } from "./schemas/deleteRowSchema.js";
import { deleteRowUtil } from "./utils/deleteRowUtil.js";

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

    await session.withTransaction(async () => {
      rowExists = await deleteRowUtil({ id: parseResult.data.id, session });
    });

    if (!rowExists) {
      res.status(404).json({ message: "Row not found" });
      return;
    }

    res.status(200).json({ message: "Row and related pallets and positions deleted" });
  } catch (error) {
    console.error("Error deleting row:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  } finally {
    await session.endSession();
  }
};

