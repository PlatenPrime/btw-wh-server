import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { createAskSchema } from "./schemas/createAskSchema.js";
import { createAskUtil } from "./utils/createAskUtil.js";
import { getCreateAskActionsUtil } from "./utils/getCreateAskActionsUtil.js";
import { getCreateAskMessageUtil } from "./utils/getCreateAskMesUtil.js";
import { sendCreateAskMesUtil } from "./utils/sendCreateAskMesUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

export const createAskController = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { artikul, nameukr, quant, com, sklad, zone, askerId } = req.body;

    // Валидация входных данных
    const parseResult = createAskSchema.safeParse({
      artikul,
      nameukr,
      quant,
      com,
      sklad,
      zone,
      askerId,
    });
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    let askerData: any = null;
    let createdAsk: any = null;

    await session.withTransaction(async () => {
      askerData = await User.findById(askerId).session(session);
      if (!askerData) {
        throw new Error("User not found");
      }

      const actions = getCreateAskActionsUtil({
        askerData,
        data: parseResult.data,
      });

      createdAsk = await createAskUtil({
        askerData,
        data: parseResult.data,
        actions,
        session,
      });
    });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "asks",
        type: "create",
        description: `Створено заявку на артикул ${parseResult.data.artikul} (${parseResult.data.quant ? parseResult.data.quant : 0} шт.)`,
      });
    }

    res.status(201).json(createdAsk);

    const message = getCreateAskMessageUtil({
      askerData,
      data: parseResult.data,
    });
    await sendCreateAskMesUtil({ message, askerData });
  } catch (error) {
    logModuleError("asks", error, "Error creating ask:");
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "User not found") {
        res.status(404).json({ message: "User not found" });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  } finally {
    await session.endSession();
  }
};
