import { Request, Response } from "express";
import mongoose from "mongoose";
import { Row } from "../../../rows/models/Row.js";
import { createPalletSchema } from "./schemas/createPalletSchema.js";
import { createPalletUtil } from "./utils/createPalletUtil.js";

export const createPalletController = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    // Валидация входных данных
    const parseResult = createPalletSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { title, rowData, sector, isDef } = parseResult.data;

    let createdPallet: any = null;

    // Транзакция для создания паллеты и обновления Row
    await session.withTransaction(async () => {
      const rowDoc = await Row.findById(rowData._id).session(session);
      if (!rowDoc) {
        throw new Error("Row not found");
      }

      createdPallet = await createPalletUtil({
        title,
        rowId: rowData._id,
        sector,
        isDef,
        rowData: rowDoc,
        session,
      });
    });

    res.status(201).json(createdPallet);
  } catch (error: any) {
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Row not found") {
        res.status(404).json({ message: "Row not found" });
      } else {
        console.error("createPalletController error:", error);
        res.status(500).json({
          message: "Server error",
          error: error instanceof Error ? error.message : error,
        });
      }
    }
  } finally {
    await session.endSession();
  }
};
