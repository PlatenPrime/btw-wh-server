import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { deleteZoneByIdSchema } from "./schemas/deleteZoneByIdSchema.js";
import { deleteZoneByIdUtil } from "./utils/deleteZoneByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const deleteZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Валидация входных данных
    const parseResult = deleteZoneByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid zone ID format",
        errors: parseResult.error.errors,
      });
      return;
    }

    const deletedZone = await deleteZoneByIdUtil(parseResult.data.id);

    if (!deletedZone) {
      res.status(404).json({
        message: "Zone not found",
      });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "zones",
        description: `Видалено зону ${deletedZone.title} (бар: ${deletedZone.bar})`,
      });
    }

    res.status(200).json({
      message: "Zone deleted successfully",
      data: deletedZone,
    });
  } catch (error) {
    logModuleError("zones", error, "Error deleting zone:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


