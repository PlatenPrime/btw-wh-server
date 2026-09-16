import fs from "node:fs";
import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { downloadExcelJobFileSchema } from "../get-excel-job/schemas/getExcelJobSchema.js";
import { downloadExcelJobFileUtil } from "./utils/downloadExcelJobFileUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const value = q[key];
  return Array.isArray(value) ? String(value[0]) : value ? String(value) : undefined;
}

export const downloadExcelJobFileController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = downloadExcelJobFileSchema.safeParse({
      id: req.params.id,
      token: firstQuery(req.query, "token"),
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await downloadExcelJobFileUtil(parseResult.data);
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    const encodedFileName = encodeURIComponent(result.fileName);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader("Content-Length", String(result.sizeBytes));
    fs.createReadStream(result.filePath).pipe(res);
  } catch (error) {
    logModuleError("excel-jobs", error, "Error downloading excel job file");
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
