import { Request, Response } from "express";
import { deleteArtsWithoutLatestMarkerSchema } from "./schemas/deleteArtsWithoutLatestMarkerSchema.js";
import { deleteArtsWithoutLatestMarkerUtil } from "./utils/deleteArtsWithoutLatestMarkerUtil.js";

/**
 * @desc    Удалить все артикулы без последнего актуального маркера
 * @route   DELETE /api/arts/without-latest-marker
 * @access  Private (PRIME)
 */
export const deleteArtsWithoutLatestMarkerController = async (
  req: Request,
  res: Response
) => {
  try {
    // Валидация входных данных (пустая схема, но для консистентности)
    const parseResult = deleteArtsWithoutLatestMarkerSchema.safeParse({});
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    // Удаляем артикулы без последнего маркера
    const result = await deleteArtsWithoutLatestMarkerUtil();

    res.status(200).json({
      message: "Arts without latest marker deleted successfully",
      result: {
        deletedCount: result.deletedCount,
        latestMarker: result.latestMarker,
      },
    });
  } catch (error) {
    console.error("Error deleting arts without latest marker:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

