import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../../../lib/excel/worksheetStyles.js";
/**
 * Створює Excel-файл для порівняння зрізів по аналогу та Btrade.
 * Перша строка: дати стовпців (YYYY-MM-DD).
 * Строки 2–5:
 *  - 2: залишок аналога (конкурент)
 *  - 3: ціна аналога (конкурент)
 *  - 4: залишок Btrade
 *  - 5: ціна Btrade
 */
export async function buildAnalogBtradeComparisonExcel(items, options) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Порівняння");
    const columnCount = items.length + 4;
    if (columnCount > 0) {
        const headerRow = worksheet.getRow(1);
        // Колонки A, B, C — дані артикулу, колонка D — підпис рядка, дати починаються з колонки E
        headerRow.getCell(1).value = "Артикул";
        headerRow.getCell(2).value = "Назва (укр)";
        headerRow.getCell(3).value = "Виробник";
        headerRow.getCell(4).value = "";
        items.forEach((item, index) => {
            const dateStr = item.date.toISOString().split("T")[0] ?? "";
            headerRow.getCell(index + 5).value = dateStr;
        });
        applyHeaderStyle(worksheet, columnCount);
        const analogStockRow = worksheet.getRow(2);
        const analogPriceRow = worksheet.getRow(3);
        const btradeStockRow = worksheet.getRow(4);
        const btradePriceRow = worksheet.getRow(5);
        const artName = options.artNameUkr ?? "";
        const producerName = options.producerName ?? "";
        // A, B, C заполняем только в первой строке блока (ряд 2)
        analogStockRow.getCell(1).value = options.artikul;
        analogStockRow.getCell(2).value = artName;
        analogStockRow.getCell(3).value = producerName;
        // Строки 3–5 в колонках A–C оставляем пустыми
        // Подписи рядков у колонці D
        analogStockRow.getCell(4).value = "Залишок аналога";
        analogPriceRow.getCell(4).value = "Ціна аналога";
        btradeStockRow.getCell(4).value = "Залишок Btrade";
        btradePriceRow.getCell(4).value = "Ціна Btrade";
        items.forEach((item, index) => {
            const col = index + 5;
            analogStockRow.getCell(col).value = item.analogStock ?? null;
            analogPriceRow.getCell(col).value = item.analogPrice ?? null;
            btradeStockRow.getCell(col).value = item.btradeStock ?? null;
            btradePriceRow.getCell(col).value = item.btradePrice ?? null;
        });
        // Условное форматирование: остатки аналога (красный при росте)
        const dataStartCol = 5; // колонка E
        for (let i = 1; i < items.length; i++) {
            const prevCell = analogStockRow.getCell(dataStartCol + i - 1);
            const currCell = analogStockRow.getCell(dataStartCol + i);
            const prevRaw = prevCell.value;
            const currRaw = currCell.value;
            const prevVal = typeof prevRaw === "number" ? prevRaw : Number(prevRaw ?? NaN);
            const currVal = typeof currRaw === "number" ? currRaw : Number(currRaw ?? NaN);
            if (!Number.isFinite(prevVal) || !Number.isFinite(currVal))
                continue;
            if (currVal > prevVal) {
                currCell.font = {
                    ...(currCell.font ?? {}),
                    color: { argb: "FFFF0000" }, // красный
                };
            }
        }
        // Условное форматирование: цены аналога (зелёный при снижении)
        for (let i = 1; i < items.length; i++) {
            const prevCell = analogPriceRow.getCell(dataStartCol + i - 1);
            const currCell = analogPriceRow.getCell(dataStartCol + i);
            const prevRaw = prevCell.value;
            const currRaw = currCell.value;
            const prevVal = typeof prevRaw === "number" ? prevRaw : Number(prevRaw ?? NaN);
            const currVal = typeof currRaw === "number" ? currRaw : Number(currRaw ?? NaN);
            if (!Number.isFinite(prevVal) || !Number.isFinite(currVal))
                continue;
            if (currVal < prevVal) {
                currCell.font = {
                    ...(currCell.font ?? {}),
                    color: { argb: "FF00AA00" }, // зелёный
                };
            }
        }
        for (let rowNumber = 2; rowNumber <= 5; rowNumber++) {
            applyDataRowStyle(worksheet, rowNumber, columnCount);
        }
        for (let c = 1; c <= columnCount; c++) {
            worksheet.getColumn(c).width = 14;
        }
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const safeArtikul = options.artikul.replace(/\s+/g, "_");
    const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
    const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
    const fileName = `analog_btrade_comparison_${safeArtikul}_${fromStr}_${toStr}.xlsx`;
    return { buffer: Buffer.from(buffer), fileName };
}
