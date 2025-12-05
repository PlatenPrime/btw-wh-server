import { Request, Response } from "express";
import mongoose from "mongoose";
import { renameBlockSchema } from "./schemas/renameBlockSchema.js";
import { renameBlockUtil } from "./utils/renameBlockUtil.js";
import { checkBlockDuplicatesUpdateUtil } from "../update-block/utils/checkBlockDuplicatesUpdateUtil.js";
import { getBlockByIdUtil } from "../get-block-by-id/utils/getBlockByIdUtil.js";

export const renameBlock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Проверка валидности ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid block ID format",
      });
      return;
    }

    // Валидация входных данных
    const parseResult = renameBlockSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { title } = parseResult.data;

    // Проверка существования блока
    const existingBlock = await getBlockByIdUtil({ id });
    if (!existingBlock) {
      res.status(404).json({
        message: "Block not found",
      });
      return;
    }

    // Проверка на дубликаты
    const duplicateBlock = await checkBlockDuplicatesUpdateUtil({
      id,
      title,
    });

    if (duplicateBlock) {
      res.status(409).json({
        message: "Block with this title already exists",
        duplicateFields: ["title"],
      });
      return;
    }

    // Переименование блока
    const renamedBlock = await renameBlockUtil({ id, title });

    if (!renamedBlock) {
      res.status(404).json({
        message: "Block not found",
      });
      return;
    }

    res.status(200).json({
      message: "Block renamed successfully",
      data: renamedBlock,
    });
  } catch (error) {
    console.error("Error renaming block:", error);

    // Обработка ошибок MongoDB
    if (error instanceof Error && error.name === "MongoServerError") {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        const duplicateField = Object.keys(mongoError.keyPattern)[0];
        res.status(409).json({
          message: `Block with this ${duplicateField} already exists`,
        });
        return;
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

