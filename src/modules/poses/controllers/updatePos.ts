import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { IPos, Pos } from "../models/Pos.js";

const updatePosSchema = z.object({
  palletId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid pallet ID",
    })
    .optional(),
  rowId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid row ID",
    })
    .optional(),
  palletTitle: z.string().optional(),
  rowTitle: z.string().optional(),
  artikul: z.string().optional(),
  quant: z.number().optional(),
  boxes: z.number().optional(),
  date: z.string().optional(),
  sklad: z.string().optional(),
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

  try {
    const pos: IPos | null = await Pos.findById(id);
    if (!pos) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    // Обновляем позицию
    const updatedPos = await Pos.findByIdAndUpdate(id, parseResult.data, {
      new: true,
      runValidators: true,
    })
      .populate("palletId", "title sector")
      .populate("rowId", "title");

    res.json(updatedPos);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update position", details: error });
  }
};
