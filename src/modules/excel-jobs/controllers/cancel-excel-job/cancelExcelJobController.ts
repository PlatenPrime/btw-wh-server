import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { getExcelJobSchema } from "../get-excel-job/schemas/getExcelJobSchema.js";
import { cancelExcelJobUtil } from "./utils/cancelExcelJobUtil.js";

export const cancelExcelJobController = async (
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

    const result = await cancelExcelJobUtil({
      id: parseResult.data.id,
      userId: req.user.id,
    });
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: "Excel job cancelled",
      data: result.data,
    });
  } catch (error) {
    logModuleError("excel-jobs", error, "Error cancelling excel job");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
