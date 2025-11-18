import { Request, Response } from "express";
import { formatArtsForExcelExtendedUtil } from "./utils/formatArtsForExcelExtendedUtil.js";
import { generateExcelExtendedUtil } from "./utils/generateExcelExtendedUtil.js";
import { getArtsForExportExtendedUtil } from "./utils/getArtsForExportExtendedUtil.js";
import { getPosesQuantByArtikulUtil } from "./utils/getPosesQuantByArtikulUtil.js";

/**
 * @desc    Экспортировать все артикулы в Excel файл с данными о запасах и витрине
 * @route   GET /api/arts/export-with-stocks
 * @access  Private (ADMIN)
 */
export const exportArtsToExcelWithStocks = async (
  req: Request,
  res: Response
) => {
  try {
    // Получаем все артикулы из базы данных
    const arts = await getArtsForExportExtendedUtil();

    if (!arts || arts.length === 0) {
      res.status(404).json({
        message: "No arts found to export",
      });
      return;
    }

    // Получаем суммы quant по artikul из позиций
    const posesQuantMap = await getPosesQuantByArtikulUtil();

    // Подготавливаем данные для Excel с расчетом Запасы и Витрина
    const excelData = formatArtsForExcelExtendedUtil(arts, posesQuantMap);

    // Генерируем Excel файл
    const { buffer, fileName } = generateExcelExtendedUtil(excelData);

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
    console.error("Error exporting arts to Excel with stocks:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

