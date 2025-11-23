import { Request, Response } from "express";
import { formatArtsForExcelUtil } from "./utils/formatArtsForExcelUtil.js";
import { generateExcelUtil } from "./utils/generateExcelUtil.js";
import { getArtsForExportUtil } from "./utils/getArtsForExportUtil.js";

/**
 * @desc    Экспортировать все артикулы в Excel файл
 * @route   GET /api/arts/export
 * @access  Private (ADMIN)
 */
export const exportArtsToExcelController = async (
  req: Request,
  res: Response
) => {
  try {
    // Получаем все артикулы из базы данных
    const arts = await getArtsForExportUtil();

    if (!arts || arts.length === 0) {
      res.status(404).json({
        message: "No arts found to export",
      });
      return;
    }

    // Подготавливаем данные для Excel
    const excelData = formatArtsForExcelUtil(arts);

    // Генерируем Excel файл
    const { buffer, fileName } = generateExcelUtil(excelData);

    // Настраиваем заголовки для скачивания файла
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);

    // Отправляем файл
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting arts to Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
