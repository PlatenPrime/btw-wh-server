import { Request, Response } from "express";
import mongoose from "mongoose";
import { upsertSegsSchema } from "./schemas/upsertSegsSchema.js";
import { upsertSegsUtil } from "./utils/upsertSegsUtil.js";

export const upsertSegsController = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const parseResult = upsertSegsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const payload = parseResult.data;
    let result: Awaited<ReturnType<typeof upsertSegsUtil>>;

    await session.withTransaction(async () => {
      result = await upsertSegsUtil({
        segs: payload,
        session,
      });
    });

    res.status(200).json({
      message: "Segments upsert completed",
      data: result!,
    });
  } catch (error) {
    console.error("upsertSegsController error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  } finally {
    await session.endSession();
  }
};


