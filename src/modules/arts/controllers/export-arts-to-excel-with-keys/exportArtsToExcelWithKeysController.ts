import { Request, Response } from "express";
import { formatArtsForExcelWithKeysUtil } from "./utils/formatArtsForExcelWithKeysUtil.js";
import { generateExcelWithKeysUtil } from "./utils/generateExcelWithKeysUtil.js";
import { getArtsForExportWithKeysUtil } from "./utils/getArtsForExportWithKeysUtil.js";

/**
 * @desc    Экспортировать все артикулы в key-based Excel файл
 * @route   GET /api/arts/export-keys
 * @access  Private (ADMIN)
 */
export const exportArtsToExcelWithKeysController = async (
  req: Request,
  res: Response
) => {
  try {
    const arts = await getArtsForExportWithKeysUtil();

    if (!arts || arts.length === 0) {
      res.status(404).json({
        message: "No arts found to export",
      });
      return;
    }

    const excelData = formatArtsForExcelWithKeysUtil(arts);
    const { buffer, fileName } = await generateExcelWithKeysUtil(excelData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`
    );
    res.setHeader("Content-Length", buffer.length);

    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting arts to key-based Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV !== "production" ? error : undefined,
      });
    }
  }
};

