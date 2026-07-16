import { Request, Response } from "express";
import { createKonkSchema } from "./schemas/createKonkSchema.js";
import { createKonkUtil } from "./utils/createKonkUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Создать конкурента
 * @route   POST /api/konks
 */
export const createKonkController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = createKonkSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const konk = await createKonkUtil({
      name: parseResult.data.name,
      title: parseResult.data.title,
      url: parseResult.data.url,
      imageUrl: parseResult.data.imageUrl,
      recountDays: parseResult.data.recountDays,
    });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "konks",
        description: `Створено конкурента ${konk.name} (id: ${konk._id})`,
      });
    }

    res.status(201).json({
      message: "Konk created successfully",
      data: konk,
    });
  } catch (error) {
    logModuleError("konks", error, "Error creating konk:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
