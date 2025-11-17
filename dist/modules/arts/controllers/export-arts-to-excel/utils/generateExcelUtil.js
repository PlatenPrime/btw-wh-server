import * as XLSX from "xlsx";
/**
 * Генерирует Excel файл из данных артикулов
 * @param excelData - массив отформатированных данных для Excel
 * @returns объект с буфером файла и именем файла
 */
export const generateExcelUtil = (excelData) => {
    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    // Настраиваем ширину колонок
    const columnWidths = [
        { wch: 15 }, // Артикул
        { wch: 30 }, // Название (укр)
        { wch: 30 }, // Название (рус)
        { wch: 10 }, // Зона
        { wch: 10 }, // Лимит
        { wch: 15 }, // Маркер
        { wch: 15 }, // Btrade Stock
        { wch: 18 }, // Дата Btrade Stock
        { wch: 15 }, // Дата создания
        { wch: 15 }, // Дата обновления
    ];
    worksheet["!cols"] = columnWidths;
    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, "Артикулы");
    // Генерируем буфер Excel файла
    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });
    // Настраиваем имя файла
    const fileName = `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer, fileName };
};
