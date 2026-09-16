import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { listExcelJobsSchema } from "../get-excel-job/schemas/getExcelJobSchema.js";
import { listExcelJobsUtil } from "./utils/listExcelJobsUtil.js";

export const listExcelJobsController = async (
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

    const parseResult = listExcelJobsSchema.safeParse({
      status: req.query.status,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await listExcelJobsUtil({
      userId: req.user.id,
      status: parseResult.data.status,
    });
    res.status(200).json({
      message: "Excel jobs retrieved successfully",
      data,
    });
  } catch (error) {
    logModuleError("excel-jobs", error, "Error listing excel jobs");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
