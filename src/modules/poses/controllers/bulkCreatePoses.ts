import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { IPos, Pos } from "../models/Pos.js";

const posItemSchema = z.object({
  palletId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid pallet ID",
  }),
  rowId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid row ID",
  }),
  palletTitle: z.string(),
  rowTitle: z.string(),
  artikul: z.string(),
  quant: z.number(),
  boxes: z.number(),
  date: z.string().optional(),
  sklad: z.string().optional(),
});

const bulkCreatePosesSchema = z.object({
  poses: z.array(posItemSchema).min(1, "At least one position is required"),
});

export const bulkCreatePoses = async (req: Request, res: Response) => {
  const parseResult = bulkCreatePosesSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }

  const { poses } = parseResult.data;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const createdPoses: IPos[] = [];
      const palletUpdates = new Map<string, mongoose.Types.ObjectId[]>();

      // Проверяем существование всех паллетов и рядов
      const palletIds = [...new Set(poses.map((p) => p.palletId))];
      const rowIds = [...new Set(poses.map((p) => p.rowId))];

      const pallets = await Pallet.find({ _id: { $in: palletIds } }).session(
        session
      );
      const rows = await Row.find({ _id: { $in: rowIds } }).session(session);

      if (pallets.length !== palletIds.length) {
        res.status(404).json({ error: "Some pallets not found" });
        throw new Error("Some pallets not found");
      }

      if (rows.length !== rowIds.length) {
        res.status(404).json({ error: "Some rows not found" });
        throw new Error("Some rows not found");
      }

      // Создаем позиции
      for (const posData of poses) {
        const pallet = pallets.find(
          (p) =>
            (p._id as mongoose.Types.ObjectId).toString() === posData.palletId
        );
        const row = rows.find(
          (r) => (r._id as mongoose.Types.ObjectId).toString() === posData.rowId
        );

        const [createdPos] = await Pos.create(
          [
            {
              pallet: {
                _id: pallet!._id,
                title: pallet!.title,
                sector: pallet!.sector,
              },
              row: {
                _id: row!._id,
                title: row!.title,
              },
              palletTitle: posData.palletTitle,
              rowTitle: posData.rowTitle,
              artikul: posData.artikul,
              quant: posData.quant,
              boxes: posData.boxes,
              date: posData.date,
              sklad: posData.sklad,
            },
          ],
          { session }
        );

        createdPoses.push(createdPos);

        // Собираем обновления для паллетов
        if (!palletUpdates.has(posData.palletId)) {
          palletUpdates.set(posData.palletId, []);
        }
        palletUpdates
          .get(posData.palletId)!
          .push(createdPos._id as mongoose.Types.ObjectId);
      }

      // Обновляем паллеты
      for (const [palletId, posIds] of palletUpdates) {
        const pallet = pallets.find(
          (p) => (p._id as mongoose.Types.ObjectId).toString() === palletId
        );
        if (pallet) {
          pallet.poses.push(...posIds);
          await pallet.save({ session });
        }
      }

      res.status(201).json({
        message: `${createdPoses.length} positions created successfully`,
        data: createdPoses,
      });
    });
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Failed to create positions", details: error });
    }
  } finally {
    await session.endSession();
  }
};
