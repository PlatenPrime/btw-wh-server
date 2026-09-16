import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { getExcelJobSchema } from "./schemas/getExcelJobSchema.js";
import { getExcelJobUtil } from "./utils/getExcelJobUtil.js";

export const getExcelJobController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: "Не авторизовано: данные пользователя отсутствуют",
      });
      return;
    }

    const parseResult = getExcelJobSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getExcelJobUtil({
      id: parseResult.data.id,
      userId: req.user.id,
    });
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: "Excel job retrieved successfully",
      data: result.data,
    });
  } catch (error) {
    logModuleError("excel-jobs", error, "Error getting excel job");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
