import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../../rows/models/Row.js";
import { createPosSchema } from "./schemas/createPosSchema.js";
import { createPosUtil } from "./utils/createPosUtil.js";

export const createPosController = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    // 1. Валидация
    const parseResult = createPosSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors });
      return;
    }

    const {
      palletId,
      rowId,
      artikul,
      nameukr,
      quant,
      boxes,
      date,
      sklad,
      comment,
    } = parseResult.data;

    // 2. Оркестрация в транзакции
    let createdPos: any = null;
    await session.withTransaction(async () => {
      // Проверяем существование паллета
      const pallet = await Pallet.findById(palletId).session(session);
      if (!pallet) {
        throw new Error("Pallet not found");
      }

      // Проверяем существование ряда
      const row = await Row.findById(rowId).session(session);
      if (!row) {
        throw new Error("Row not found");
      }

      // Создаём позицию
      createdPos = await createPosUtil({
        artikul,
        nameukr,
        quant,
        boxes,
        date,
        sklad,
        comment,
        pallet,
        row,
        session,
      });

      // Добавляем позицию в паллет
      pallet.poses.push(createdPos._id as mongoose.Types.ObjectId);
      await pallet.save({ session });
    });

    // 3. HTTP ответ
    res.status(201).json(createdPos);
  } catch (error) {
    // 4. Обработка ошибок с правильными статусами
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Pallet not found") {
        res.status(404).json({ error: "Pallet not found" });
      } else if (error instanceof Error && error.message === "Row not found") {
        res.status(404).json({ error: "Row not found" });
      } else {
        res
          .status(500)
          .json({ error: "Failed to create position", details: error });
      }
    }
  } finally {
    await session.endSession();
  }
};
