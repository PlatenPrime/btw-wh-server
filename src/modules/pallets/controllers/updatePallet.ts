import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";

const updatePalletSchema = z.object({
  title: z.string().min(1).optional(),
  rowId: z
    .string()
    .refine((val: any) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid rowId",
    })
    .optional(),
  poses: z
    .array(
      z.string().refine((val: any) => mongoose.Types.ObjectId.isValid(val))
    )
    .optional(),
  sector: z.string().optional(),
});

export const updatePallet = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid pallet ID" });
    return;
  }
  const parseResult = updatePalletSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }
  try {
    const pallet = await Pallet.findById(id);
    if (!pallet) {
      res.status(404).json({ error: "Pallet not found" });
      return;
    }
    // If row is being changed, update both old and new row's pallets arrays
    if (
      parseResult.data.rowId &&
      pallet.rowId &&
      parseResult.data.rowId !== pallet.rowId.toString()
    ) {
      const oldRow = await Row.findById(pallet.rowId);
      const newRow = await Row.findById(parseResult.data.rowId);
      if (!newRow) {
        res.status(404).json({ error: "New rowId not found" });
        return;
      }
      if (oldRow) {
        oldRow.pallets = oldRow.pallets.filter(
          (pid: any) => pid.toString() !== id
        );
        await oldRow.save();
      }
      newRow.pallets.push(pallet._id as mongoose.Types.ObjectId);
      await newRow.save();
      pallet.set("rowId", new Types.ObjectId(parseResult.data.rowId));
    }
    if (parseResult.data.title !== undefined)
      pallet.title = parseResult.data.title;
    if (parseResult.data.poses !== undefined)
      pallet.set(
        "poses",
        parseResult.data.poses.map((p: string) => new Types.ObjectId(p))
      );
    if (parseResult.data.sector !== undefined)
      pallet.sector = parseResult.data.sector;
    await pallet.save();
    res.json(pallet);
  } catch (error) {
    res.status(500).json({ error: "Failed to update pallet", details: error });
  }
};
