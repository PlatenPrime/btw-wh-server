import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { Pos } from "../models/Pos.js";
import { createPosSchema } from "../createPosSchema.js";



export const createPos = async (req: Request, res: Response) => {
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
    comment
  } = parseResult.data;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Проверяем существование паллета
      const pallet = await Pallet.findById(palletId).session(session);
      if (!pallet) {
        res.status(404).json({ error: "Pallet not found" });
        return;
      }

      // Проверяем существование ряда
      const row = await Row.findById(rowId).session(session);
      if (!row) {
        res.status(404).json({ error: "Row not found" });
        return;
      }

      // Создаем позицию с новой структурой
      const [createdPos] = await Pos.create(
        [
          {
            pallet: pallet._id,
            row: row._id,
            palletTitle: pallet.title,
            rowTitle: row.title,
            palletData: {
              _id: pallet._id,
              title: pallet.title,
              sector: pallet.sector,
            },
            rowData: {
              _id: row._id,
              title: row.title,
            },
            artikul,
            nameukr,
            quant,
            boxes,
            date,
            sklad,
            comment
          },
        ],
        { session }
      );

      // Добавляем позицию в паллет
      pallet.poses.push(createdPos._id as mongoose.Types.ObjectId);
      await pallet.save({ session });

      res.status(201).json(createdPos);
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
