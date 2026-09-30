import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { listApiTasksSchema } from "../get-api-task/schemas/getApiTaskSchema.js";
import { listApiTasksUtil } from "./utils/listApiTasksUtil.js";

export const listApiTasksController = async (
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

    const parseResult = listApiTasksSchema.safeParse({
      status: req.query.status,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await listApiTasksUtil({
      userId: req.user.id,
      status: parseResult.data.status,
    });
    res.status(200).json({
      message: "Api tasks retrieved successfully",
      data,
    });
  } catch (error) {
    logModuleError("apitasks", error, "Error listing api tasks");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
