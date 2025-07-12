import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { Pos } from "../models/Pos.js";

const createPosSchema = z.object({
  palletId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid pallet ID",
  }),
  rowId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid row ID",
  }),
  palletTitle: z.string().optional(),
  rowTitle: z.string().optional(),
  artikul: z.string().optional(),
  quant: z.number().optional(),
  boxes: z.number().optional(),
  date: z.string().optional(),
  sklad: z.string().optional(),
});

export const createPos = async (req: Request, res: Response) => {
  const parseResult = createPosSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }

  const {
    palletId,
    rowId,
    palletTitle,
    rowTitle,
    artikul,
    quant,
    boxes,
    date,
    sklad,
  } = parseResult.data;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Проверяем существование паллета
      const pallet = await Pallet.findById(palletId).session(session);
      if (!pallet) {
        res.status(404).json({ error: "Pallet not found" });
        throw new Error("Pallet not found");
      }

      // Проверяем существование ряда
      const row = await Row.findById(rowId).session(session);
      if (!row) {
        res.status(404).json({ error: "Row not found" });
        throw new Error("Row not found");
      }

      // Создаем позицию
      const [createdPos] = await Pos.create(
        [
          {
            palletId,
            rowId,
            palletTitle: palletTitle || pallet.title,
            rowTitle: rowTitle || row.title,
            artikul,
            quant,
            boxes,
            date,
            sklad,
          },
        ],
        { session }
      );

      // Добавляем позицию в паллет
      pallet.poses.push(createdPos._id as mongoose.Types.ObjectId);
      await pallet.save({ session });

      // Заполняем связанные данные
      const populatedPos = await Pos.findById(createdPos._id)
        .populate("palletId", "title sector")
        .populate("rowId", "title")
        .session(session);

      res.status(201).json(populatedPos);
    });
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Failed to create position", details: error });
    }
  } finally {
    await session.endSession();
  }
};
