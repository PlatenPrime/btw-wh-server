import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { getApiTaskSchema } from "../get-api-task/schemas/getApiTaskSchema.js";
import { cancelApiTaskUtil } from "./utils/cancelApiTaskUtil.js";

export const cancelApiTaskController = async (
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

    const result = await cancelApiTaskUtil({
      id: parseResult.data.id,
      userId: req.user.id,
    });
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: "Api task cancelled",
      data: result.data,
    });
  } catch (error) {
    logModuleError("apitasks", error, "Error cancelling api task");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
