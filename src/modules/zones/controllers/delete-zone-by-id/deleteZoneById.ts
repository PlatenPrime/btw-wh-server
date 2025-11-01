import { Request, Response } from "express";
import { deleteZoneByIdSchema } from "./schemas/deleteZoneByIdSchema.js";
import { deleteZoneByIdUtil } from "./utils/deleteZoneByIdUtil.js";

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

    res.status(200).json({
      message: "Zone deleted successfully",
      data: deletedZone,
    });
  } catch (error) {
    console.error("Error deleting zone:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


