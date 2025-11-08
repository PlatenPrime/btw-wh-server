import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { updateAskByIdSchema } from "./schemas/updateAskByIdSchema.js";
import { updateAskUtil } from "./utils/updateAskUtil.js";

export const updateAskById = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { solverId, action, status, event } = req.body;

    // Валидация входных данных
    const parseResult = updateAskByIdSchema.safeParse({
      id,
      solverId,
      action,
      status,
      event,
    });
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    let updatedAsk: any = null;

    await session.withTransaction(async () => {
      const existingAsk = await Ask.findById(id).session(session);
      if (!existingAsk) {
        throw new Error("Ask not found");
      }

      const solver = await User.findById(solverId).session(session);
      if (!solver) {
        throw new Error("Solver user not found");
      }

      updatedAsk = await updateAskUtil({
        solver,
        solverId,
        ask: existingAsk,
        action: parseResult.data.action,
        status: parseResult.data.status,
        event: parseResult.data.event,
        session,
      });
    });

    res.status(200).json(updatedAsk);
  } catch (error) {
    console.error("Error updating ask:", error);
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
