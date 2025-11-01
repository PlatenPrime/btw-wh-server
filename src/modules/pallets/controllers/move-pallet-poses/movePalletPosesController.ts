import { Request, Response } from "express";
import mongoose from "mongoose";
import { movePalletPosesSchema } from "./schemas/movePalletPosesSchema.js";
import { movePalletPosesUtil } from "./utils/movePalletPosesUtil.js";

export const movePalletPosesController = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    // Валидация входных данных
    const parseResult = movePalletPosesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { sourcePalletId, targetPalletId } = parseResult.data;

    // Проверка что ID разные
    if (sourcePalletId === targetPalletId) {
      res.status(400).json({
        message: "Source and target pallet IDs must be different",
      });
      return;
    }

    let result: any = null;

    // Транзакция для перемещения poses
    await session.withTransaction(async () => {
      result = await movePalletPosesUtil({
        sourcePalletId,
        targetPalletId,
        session,
      });
    });

    res.status(200).json({
      message: "Poses moved successfully",
      targetPallet: result.targetPallet,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      if (
        error instanceof Error &&
        (error.message === "Source pallet not found" ||
          error.message === "Target pallet not found" ||
          error.message === "Target row not found")
      ) {
        res.status(404).json({ message: error.message });
      } else if (
        error instanceof Error &&
        (error.message === "Target pallet must be empty" ||
          error.message === "Source pallet has no poses to move")
      ) {
        res.status(400).json({ message: error.message });
      } else {
        console.error("movePalletPosesController error:", error);
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


