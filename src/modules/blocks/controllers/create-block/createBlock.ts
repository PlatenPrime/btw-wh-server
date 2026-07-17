import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { createBlockSchema } from "./schemas/createBlockSchema.js";
import { checkBlockDuplicatesUtil } from "./utils/checkBlockDuplicatesUtil.js";
import { createBlockUtil } from "./utils/createBlockUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const createBlock = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const parseResult = createBlockSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const blockData = parseResult.data;

    // Проверка на дубликаты
    const duplicateBlock = await checkBlockDuplicatesUtil(blockData);

    if (duplicateBlock) {
      res.status(409).json({
        message: "Block with this title already exists",
        duplicateFields: ["title"],
      });
      return;
    }

    // Создание нового блока
    const block = await createBlockUtil(blockData);

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "blocks",
        type: "create",
        description: `Створено блок ${block.title}`,
      });
    }

    res.status(201).json({
      message: "Block created successfully",
      data: block,
    });
  } catch (error) {
    logModuleError("blocks", error, "Error creating block:");

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

