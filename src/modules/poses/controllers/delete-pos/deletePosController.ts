import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { IPos, Pos } from "../../models/Pos.js";
import { deletePosUtil } from "./utils/deletePosUtil.js";

export const deletePosController = async (req: Request, res: Response) => {
  const { id } = req.params;

  // 1. Валидация ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid position ID" });
    return;
  }

  const session = await mongoose.startSession();
  try {
    // 2. Оркестрация в транзакции
    await session.withTransaction(async () => {
      const deletedPos = await deletePosUtil({ posId: id, session });

      // Удаляем позицию из паллета
      const pallet = await Pallet.findById(deletedPos.pallet._id).session(
        session
      );
      if (pallet) {
        pallet.poses = pallet.poses.filter(
          (posId: any) => posId.toString() !== id
        );
        await pallet.save({ session });
      }
    });

    // 3. HTTP ответ
    res.status(200).json({ message: "Position deleted successfully" });
  } catch (error) {
    // 4. Обработка ошибок
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Position not found") {
        res.status(404).json({ error: "Position not found" });
      } else {
        res.status(500).json({
          error: "Failed to delete position",
          details: error,
        });
      }
    }
  } finally {
    await session.endSession();
  }
};

