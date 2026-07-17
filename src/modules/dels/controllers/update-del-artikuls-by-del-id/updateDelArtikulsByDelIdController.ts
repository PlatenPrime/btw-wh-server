import { Request, Response } from "express";
import { Del } from "../../models/Del.js";
import { updateDelArtikulsSchema } from "./schemas/updateDelArtikulsSchema.js";
import { updateDelArtikulsByDelIdUtil } from "./utils/updateDelArtikulsByDelIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Запуск фонового обновления всех артикулов поставки (sharik.ua)
 * @route   POST /api/dels/:id/artikuls/update-all
 */
export const updateDelArtikulsByDelIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = updateDelArtikulsSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const del = await Del.findById(parseResult.data.id);
    if (!del) {
      res.status(404).json({ message: "Del not found" });
      return;
    }

    updateDelArtikulsByDelIdUtil(parseResult.data.id).catch((error) => {
      logModuleError("dels", error, "Error in background updateDelArtikulsByDelId:");
    });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "dels",
        type: "edit",
        description: `Запущено оновлення всіх артикулів поставки "${del.title}" (id: ${parseResult.data.id})`,
      });
    }

    res.status(202).json({
      message: "Del artikuls update process started",
    });
  } catch (error) {
    logModuleError("dels", error, "Error starting del artikuls update:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
