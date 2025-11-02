import { Request, Response } from "express";
import mongoose from "mongoose";
import { Row } from "../../../rows/models/Row.js";
import { Pallet } from "../../models/Pallet.js";
import { updatePalletSchema } from "./schemas/updatePalletSchema.js";
import { updatePalletUtil } from "./utils/updatePalletUtil.js";
import { updatePosesPalletDataUtil } from "./utils/updatePosesPalletDataUtil.js";

export const updatePalletController = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const body = req.body;

    // Валидация входных данных
    const parseResult = updatePalletSchema.safeParse({ id, ...body });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    if (!body || (body.title !== undefined && !body.title)) {
      res.status(400).json({ message: "Invalid update data" });
      return;
    }

    const { title, sector, poses, rowId, isDef } = parseResult.data;

    let updatedPallet: any = null;

    // Транзакция для обновления паллеты
    await session.withTransaction(async () => {
      let rowDoc = null;

      if (rowId !== undefined) {
        rowDoc = await Row.findById(rowId).session(session);
        if (!rowDoc) {
          throw new Error("Row not found");
        }
      }

      updatedPallet = await updatePalletUtil({
        palletId: id,
        title,
        rowId,
        poses,
        sector,
        isDef,
        rowDoc: rowDoc || undefined,
        session,
      });

      // Обновление связанных Pos
      await updatePosesPalletDataUtil({
        palletId: id,
        title,
        sector,
        isDef,
        session,
      });
    });

    res.status(200).json(updatedPallet);
  } catch (error: any) {
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Pallet not found") {
        res.status(404).json({ message: "Pallet not found" });
      } else if (error instanceof Error && error.message === "Row not found") {
        res.status(404).json({ message: "Row not found" });
      } else {
        console.error("updatePalletController error:", error);
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





