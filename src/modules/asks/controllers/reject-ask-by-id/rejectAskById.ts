import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { rejectAskByIdSchema } from "./schemas/rejectAskByIdSchema.js";
import { getRejectAskMesUtil } from "./utils/getRejectAskMesUtil.js";
import { rejectAskUtil } from "./utils/rejectAskUtil.js";
import { sendRejectAskMesUtil } from "./utils/sendRejectAskMesUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

export const rejectAskById = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { solverId } = req.body;

    // Валидация входных данных
    const parseResult = rejectAskByIdSchema.safeParse({ id, solverId });
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

      updatedAsk = await rejectAskUtil({
        solver,
        solverId,
        ask: existingAsk,
        session,
      });
    });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "asks",
        type: "edit",
        description: `Відхилено заявку на артикул ${existingAsk.artikul} (виконавець: ${solver.fullname})`,
      });
    }

    res.status(200).json(updatedAsk);

    // Отправка уведомления создателю запроса об отклонении
    if (existingAsk?.askerData?.telegram) {
      const message = getRejectAskMesUtil({
        ask: existingAsk,
        solverName: solver.fullname,
      });
      await sendRejectAskMesUtil({
        message,
        telegramChatId: existingAsk.askerData.telegram as string,
      });
    }
  } catch (error) {
    logModuleError("asks", error, "Error rejecting ask:");
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

