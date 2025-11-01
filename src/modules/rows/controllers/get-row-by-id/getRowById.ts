import { Request, Response } from "express";
import { getRowByIdSchema } from "./schemas/getRowByIdSchema.js";
import { getRowByIdUtil } from "./utils/getRowByIdUtil.js";

export const getRowById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Валидация входных данных
    const parseResult = getRowByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const rowData = await getRowByIdUtil(parseResult.data.id);

    if (!rowData) {
      res.status(200).json({
        exists: false,
        message: "Row not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      exists: true,
      message: "Row retrieved successfully",
      data: rowData,
    });
  } catch (error) {
    console.error("Error fetching row:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  }
};
