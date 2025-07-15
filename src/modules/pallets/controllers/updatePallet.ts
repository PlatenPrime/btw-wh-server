import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
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
  const { id } = req.params || {};
  const body = req.body;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid pallet ID" });
  }
  if (!body || (body.title !== undefined && !body.title)) {
    return res.status(400).json({ message: "Invalid update data" });
  }
  const parseResult = updatePalletSchema.safeParse(body);
  if (!parseResult.success) {
    return res.status(400).json({
      message: "Invalid update data",
      error: parseResult.error.errors,
    });
  }
  const session = await Pallet.startSession();
  try {
    await session.withTransaction(async () => {
      try {
        const pallet = await Pallet.findById(id).session(session);
        if (!pallet) {
          return res.status(404).json({ message: "Pallet not found" });
        }
        const { title, sector, poses } = parseResult.data;
        if (title !== undefined) pallet.title = title;
        if (sector !== undefined) pallet.sector = sector;
        if (poses !== undefined)
          pallet.poses = poses.map((id) => new mongoose.Types.ObjectId(id));
        await pallet.save({ session });
        const palletObj = pallet.toObject();
        return res.status(200).json({
          ...palletObj,
          _id: (palletObj._id as mongoose.Types.ObjectId).toString(),
          row: palletObj.row
            ? { ...palletObj.row, _id: palletObj.row._id.toString() }
            : undefined,
          poses: Array.isArray(palletObj.poses)
            ? palletObj.poses.map((id: any) => id.toString())
            : palletObj.poses,
        });
      } catch (err: any) {
        if (err.name === "ValidationError" || err.name === "CastError") {
          return res.status(400).json({ message: err.message, error: err });
        }
        return res.status(500).json({ message: "Server error", error: err });
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error });
  } finally {
    await session.endSession();
  }
};
