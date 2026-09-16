import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { isExcelJobKind } from "../../constants/excelJobConstants.js";
import { createExcelJobSchema } from "./schemas/createExcelJobSchema.js";
import { createExcelJobUtil } from "./utils/createExcelJobUtil.js";

export const createExcelJobController = async (
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

    const parseResult = createExcelJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }
    if (!isExcelJobKind(parseResult.data.kind)) {
      res.status(400).json({ message: "Unknown excel job kind" });
      return;
    }

    const result = await createExcelJobUtil({
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
      message: "Excel job accepted",
      data: result.data,
    });
  } catch (error) {
    logModuleError("excel-jobs", error, "Error creating excel job");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
