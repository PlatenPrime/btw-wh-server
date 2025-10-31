import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { completeAskByIdSchema } from "./schemas/completeAskByIdSchema.js";
import { completeAskUtil } from "./utils/completeAskUtil.js";
import { getCompleteAskMesUtil } from "./utils/getCompleteAskMesUtil.js";
import { sendCompleteAskMesUtil } from "./utils/sendCompleteAskMesUtil.js";

export const completeAskById = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { solverId } = req.body;

    // Валидация входных данных
    const parseResult = completeAskByIdSchema.safeParse({ id, solverId });
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    let existingAsk: any = null;
    let solver: any = null;
    let updatedAsk: any = null;

    await session.withTransaction(async () => {
      existingAsk = await Ask.findById(id).session(session);
      if (!existingAsk) {
        throw new Error("Ask not found");
      }

      solver = await User.findById(solverId).session(session);
      if (!solver) {
        throw new Error("Solver user not found");
      }

      updatedAsk = await completeAskUtil({
        solver,
        solverId,
        ask: existingAsk,
        session,
      });
    });

    res.status(200).json(updatedAsk);

    // Отправка уведомления создателю запроса о выполнении
    if (existingAsk?.askerData?.telegram) {
      const message = getCompleteAskMesUtil({
        ask: updatedAsk,
        solverName: solver.fullname,
      });
      await sendCompleteAskMesUtil({
        message,
        telegramChatId: existingAsk.askerData.telegram as string,
      });
    }
  } catch (error) {
    console.error("Error completing ask:", error);
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
