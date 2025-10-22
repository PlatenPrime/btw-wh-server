import * as XLSX from "xlsx";
import { Zone } from "../models/Zone.js";
export const exportZonesToExcel = async (req, res) => {
    try {
        // Получаем все зоны из базы данных
        const zones = await Zone.find().sort({ sector: 1, title: 1 });
        if (!zones || zones.length === 0) {
            return res.status(404).json({
                message: "No zones found to export",
            });
        }
        // Подготавливаем данные для Excel
        const excelData = zones.map((zone) => ({
            "Название зоны": zone.title,
            Штрихкод: zone.bar,
            Сектор: zone.sector,
            "Дата создания": zone.createdAt.toLocaleDateString("ru-RU"),
            "Дата обновления": zone.updatedAt.toLocaleDateString("ru-RU"),
        }));
        // Создаем рабочую книгу
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        // Настраиваем ширину колонок
        const columnWidths = [
            { wch: 15 }, // Название зоны
            { wch: 12 }, // Штрихкод
            { wch: 10 }, // Сектор
            { wch: 15 }, // Дата создания
            { wch: 15 }, // Дата обновления
        ];
        worksheet["!cols"] = columnWidths;
        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, "Зоны");
        // Генерируем буфер Excel файла
        const excelBuffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });
        // Настраиваем заголовки для скачивания файла
        const fileName = `zones_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Length", excelBuffer.length);
        // Отправляем файл
        res.status(200).send(excelBuffer);
    }
    catch (error) {
        console.error("Error exporting zones to Excel:", error);
        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
};
