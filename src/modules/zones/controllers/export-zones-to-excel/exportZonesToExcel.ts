import { Request, Response } from "express";
import { formatZonesForExcelUtil } from "./utils/formatZonesForExcelUtil.js";
import { generateExcelUtil } from "./utils/generateExcelUtil.js";
import { getZonesForExportUtil } from "./utils/getZonesForExportUtil.js";

export const exportZonesToExcel = async (req: Request, res: Response) => {
  try {
    // Получаем все зоны из базы данных
    const zones = await getZonesForExportUtil();

    if (!zones || zones.length === 0) {
      return res.status(404).json({
        message: "No zones found to export",
      });
    }

    // Подготавливаем данные для Excel
    const excelData = formatZonesForExcelUtil(zones);

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
    console.error("Error exporting zones to Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

