import * as XLSX from "xlsx";
export const generateExcelUtil = (excelData) => {
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
    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });
    // Настраиваем имя файла
    const fileName = `zones_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer, fileName };
};
