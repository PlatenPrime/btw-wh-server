import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { pullAskByIdSchema } from "./schemas/pullAskByIdSchema.js";
import { pullAskUtil } from "./utils/pullAskUtil.js";

export const pullAskById = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const parseResult = pullAskByIdSchema.safeParse({
      id,
      solverId: req.body.solverId,
      action: req.body.action,
      pullAskData: req.body.pullAskData,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    const {
      id: parsedAskId,
      solverId: parsedSolverId,
      action: parsedAction,
      pullAskData: parsedPullAskData,
    } = parseResult.data;

    let updatedAsk: any = null;

    await session.withTransaction(async () => {
      const existingAsk = await Ask.findById(parsedAskId).session(session);
      if (!existingAsk) {
        throw new Error("Ask not found");
      }

      const solver = await User.findById(parsedSolverId).session(session);
      if (!solver) {
        throw new Error("Solver user not found");
      }

      updatedAsk = await pullAskUtil({
        solver,
        solverId: solver._id as mongoose.Types.ObjectId,
        ask: existingAsk,
        action: parsedAction,
        pullAskData: parsedPullAskData,
        session,
      });
    });

    res.status(200).json(updatedAsk);
  } catch (error) {
    console.error("Error pulling ask:", error);
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Ask not found") {
        res.status(404).json({ message: "Ask not found" });
      } else if (
        error instanceof Error &&
        error.message === "Solver user not found"
      ) {
        res.status(404).json({ message: "Solver user not found" });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  } finally {
    await session.endSession();
  }
};
