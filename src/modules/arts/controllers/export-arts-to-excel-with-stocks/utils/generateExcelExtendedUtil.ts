import * as XLSX from "xlsx";
import { ExcelArtRowExtended } from "./types.js";

/**
 * Генерирует Excel файл из расширенных данных артикулов
 * @param excelData - массив отформатированных данных для Excel с колонками Запасы и Витрина
 * @returns объект с буфером файла и именем файла
 */
export const generateExcelExtendedUtil = (
  excelData: ExcelArtRowExtended[]
): {
  buffer: Buffer;
  fileName: string;
} => {
  // Создаем рабочую книгу
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Настраиваем ширину колонок (включая новые колонки Запасы и Витрина)
  const columnWidths = [
    { wch: 12 }, // Артикул
    { wch: 15 }, // Факт
    { wch: 15 }, // Вітрина
    { wch: 15 }, // Сайт
    { wch: 15 }, // Склад
    { wch: 45 }, // Назва (укр)
    { wch: 10 }, // Зона
    { wch: 10 }, // Ліміт
    { wch: 15 }, // Маркер
    { wch: 18 }, // Дата
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
  const fileName = `arts_export_with_stocks_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  return { buffer, fileName };
};
