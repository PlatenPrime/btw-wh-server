import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";

function serializeIds(obj: any): any {
  if (Array.isArray(obj)) return obj.map(serializeIds);
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (obj[key] instanceof Types.ObjectId) {
        result[key] = obj[key].toString();
      } else {
        result[key] = serializeIds(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

const createPalletSchema = z.object({
  title: z.string().min(1),
  row: z.object({
    _id: z.union([
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid row ID",
      }),
      z.instanceof(Types.ObjectId),
    ]),
    title: z.string().min(1),
  }),
  poses: z
    .array(z.string().refine((val) => Types.ObjectId.isValid(val)))
    .optional(),
  sector: z.string().optional(),
});

export const createPallet = async (req: Request, res: Response) => {
  // Convert ObjectId to string for validation
  const body = { ...req.body };
  if (
    !body.title ||
    !body.row ||
    !body.row._id ||
    !body.row.title ||
    (typeof body.row._id !== "string" &&
      !(body.row._id instanceof Types.ObjectId))
  ) {
    return res
      .status(400)
      .json({ message: "Title and row with valid _id and title are required" });
  }
  if (
    typeof body.row._id !== "string" &&
    body.row._id instanceof Types.ObjectId
  ) {
    body.row = { ...body.row, _id: body.row._id.toString() };
  }
  const parseResult = createPalletSchema.safeParse(body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", error: parseResult.error.errors });
  }
  const { title, row, poses, sector } = parseResult.data;
  const session = await Pallet.startSession();
  try {
    let result: any = null;
    let error: any = null;
    await session.withTransaction(async () => {
      try {
        const rowDoc = await Row.findById(row._id).session(session);
        if (!rowDoc) {
          error = { status: 404, message: "Row not found" };
          return;
        }
        const created = await Pallet.create(
          [
            {
              title,
              row: rowDoc._id,
              rowData: { _id: rowDoc._id, title: rowDoc.title },
              poses,
              sector,
            },
          ],
          { session }
        );
        if (!created || !created[0]) {
          error = { status: 500, message: "Failed to create pallet" };
          return;
        }
        rowDoc.pallets.push(created[0]._id as Types.ObjectId);
        await rowDoc.save({ session });
        result = serializeIds(created[0].toObject());
      } catch (err: any) {
        error = err;
      }
    });
    if (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message, error });
      }
      return res.status(500).json({ message: "Server error", error });
    }
    if (!result) {
      return res.status(500).json({ message: "Unknown error" });
    }
    return res.status(201).json(result);
  } catch (error: any) {
    // Debug log for diagnosis
    console.error("createPallet error:", error);
    return res.status(500).json({ message: "Server error", error });
  } finally {
    await session.endSession();
  }
};
