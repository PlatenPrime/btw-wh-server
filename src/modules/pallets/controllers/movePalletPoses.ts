import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Pos } from "../../poses/models/Pos.js";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";

const movePalletPosesSchema = z.object({
  sourcePalletId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid sourcePalletId",
    }),
  targetPalletId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid targetPalletId",
    }),
});

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const movePalletPoses = async (req: Request, res: Response) => {
  const parseResult = movePalletPosesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", error: parseResult.error.errors });
  }
  const { sourcePalletId, targetPalletId } = parseResult.data;
  if (sourcePalletId === targetPalletId) {
    return res
      .status(400)
      .json({ message: "Source and target pallet IDs must be different" });
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [sourcePallet, targetPallet] = await Promise.all([
        Pallet.findById(sourcePalletId).session(session),
        Pallet.findById(targetPalletId).session(session),
      ]);
      if (!sourcePallet) {
        throw new HttpError(404, "Source pallet not found");
      }
      if (!targetPallet) {
        throw new HttpError(404, "Target pallet not found");
      }
      if (!Array.isArray(targetPallet.poses) || targetPallet.poses.length > 0) {
        throw new HttpError(400, "Target pallet must be empty");
      }
      if (
        !Array.isArray(sourcePallet.poses) ||
        sourcePallet.poses.length === 0
      ) {
        throw new HttpError(400, "Source pallet has no poses to move");
      }
      const targetRow = await Row.findById(targetPallet.row._id).session(
        session
      );
      if (!targetRow) {
        throw new HttpError(404, "Target row not found");
      }
      const posesToMove = await Pos.find({
        _id: { $in: sourcePallet.poses },
      }).session(session);
      for (const pos of posesToMove) {
        // Основные данные — palletData и rowData
        pos.palletData = {
          _id: targetPallet._id as mongoose.Types.ObjectId,
          title: targetPallet.title,
          sector: targetPallet.sector,
        };
        pos.rowData = {
          _id: targetRow._id as mongoose.Types.ObjectId,
          title: targetRow.title,
        };
        pos.palletTitle = targetPallet.title;
        pos.rowTitle = targetRow.title;
        // Для обратной совместимости
        pos.pallet = targetPallet._id as mongoose.Types.ObjectId;
        pos.row = targetRow._id as mongoose.Types.ObjectId;
        await pos.save({ session });
      }
      targetPallet.poses = sourcePallet.poses;
      sourcePallet.poses = [];
      await Promise.all([
        targetPallet.save({ session }),
        sourcePallet.save({ session }),
      ]);
      const palletObj = targetPallet.toObject();
      const responseObj = {
        _id: (palletObj._id as mongoose.Types.ObjectId).toString(),
        title: palletObj.title,
        row: (palletObj.row as mongoose.Types.ObjectId).toString(),
        rowData: {
          _id: (palletObj.rowData._id as mongoose.Types.ObjectId).toString(),
          title: palletObj.rowData.title,
        },
        poses: Array.isArray(palletObj.poses)
          ? palletObj.poses.map((id: any) => id.toString())
          : [],
        sector: palletObj.sector,
        createdAt: palletObj.createdAt,
        updatedAt: palletObj.updatedAt,
      };
      res.status(200).json({
        message: "Poses moved successfully",
        targetPallet: responseObj,
      });
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message, error });
    }
    return res.status(500).json({ message: "Server error", error });
  } finally {
    await session.endSession();
  }
};
