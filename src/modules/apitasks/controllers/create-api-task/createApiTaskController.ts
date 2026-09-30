import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { isApiTaskKind } from "../../constants/apiTaskConstants.js";
import { createApiTaskSchema } from "./schemas/createApiTaskSchema.js";
import { createApiTaskUtil } from "./utils/createApiTaskUtil.js";

export const createApiTaskController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id || !req.user.role) {
      res.status(401).json({
        message: "Не авторизовано: данные пользователя отсутствуют",
      });
      return;
    }

    const parseResult = createApiTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }
    if (!isApiTaskKind(parseResult.data.kind)) {
      res.status(400).json({ message: "Unknown api task kind" });
      return;
    }

    const result = await createApiTaskUtil({
      kind: parseResult.data.kind,
      params: parseResult.data.params,
      userId: req.user.id,
      userRole: req.user.role,
    });
    if (!result.ok) {
      res.status(result.status).json({
        message: result.message,
        ...("errors" in result && result.errors ? { errors: result.errors } : {}),
      });
      return;
    }

    res.status(202).json({
      message: "Api task accepted",
      data: result.data,
    });
  } catch (error) {
    logModuleError("apitasks", error, "Error creating api task");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
