import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { getApiTaskSchema } from "./schemas/getApiTaskSchema.js";
import { getApiTaskUtil } from "./utils/getApiTaskUtil.js";

export const getApiTaskController = async (
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

    const parseResult = getApiTaskSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getApiTaskUtil({
      id: parseResult.data.id,
      userId: req.user.id,
    });
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: "Api task retrieved successfully",
      data: result.data,
    });
  } catch (error) {
    logModuleError("apitasks", error, "Error getting api task");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
