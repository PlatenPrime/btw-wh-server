import { Request, Response } from "express";
import mongoose from "mongoose";
import { bulkCreatePosesSchema } from "./schemas/bulkCreatePosesSchema.js";
import { bulkCreatePosesUtil } from "./utils/bulkCreatePosesUtil.js";

export const bulkCreatePosesController = async (
  req: Request,
  res: Response
) => {
  // 1. Валидация (вне try/catch согласно документации)
  const parseResult = bulkCreatePosesSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }

  const { poses } = parseResult.data;

  const session = await mongoose.startSession();
  try {
    // 2. Оркестрация в транзакции
    let createdPoses: any = null;
    await session.withTransaction(async () => {
      createdPoses = await bulkCreatePosesUtil({ poses, session });
    });

    // 3. HTTP ответ
    res.status(201).json({
      message: `${createdPoses.length} positions created successfully`,
      data: createdPoses,
    });
  } catch (error) {
    // 5. Обработка ошибок
    if (!res.headersSent) {
      if (
        error instanceof Error &&
        (error.message === "Some pallets not found" ||
          error.message === "Some rows not found")
      ) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({
          error: "Failed to create positions",
          details: error,
        });
      }
    }
  } finally {
    await session.endSession();
  }
};

