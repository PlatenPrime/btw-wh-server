import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { IPos, Pos } from "../models/Pos.js";

const updatePosSchema = z.object({
  artikul: z.string().optional(),
  nameukr: z.string().optional(),
  quant: z.number().optional(),
  boxes: z.number().optional(),
  date: z.string().optional(),
  sklad: z.string().optional(),
  comment: z.string().optional(),
});

export const updatePos = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid position ID" });
    return;
  }

  const parseResult = updatePosSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const pos: IPos | null = await Pos.findById(id).session(session);
      if (!pos) {
        res.status(404).json({ error: "Position not found" });
        return;
      }

      // Подготавливаем данные для обновления
      const updateData: any = { ...parseResult.data };


      // Обновляем позицию
      const updatedPos = await Pos.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        session,
      });

      console.log("Updated Pos: ", updatedPos);

      res.json(updatedPos);
    });
  } catch (error) {
    if (!res.headersSent) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update position";
      const statusCode = errorMessage.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        error: statusCode === 500 ? "Failed to update position" : errorMessage,
        ...(statusCode === 500 && { details: error }),
      });
    }
  } finally {
    await session.endSession();
  }
};
