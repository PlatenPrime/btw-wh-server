import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../lib/excel/worksheetStyles.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { formatDateHeader } from "../../sku-slices/utils/buildSkuSliceExcel.js";
const HEADER_LABELS = [
    "Ідентифікатор товару",
    "Конкурент (ключ)",
    "Виробник (ключ)",
    "Назва",
    "Посилання",
    "Дата створення",
    "Невалідний",
];
export async function buildSkuCatalogExcelBuffer(rows, fileNameBase) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("SKU");
    const headerRow = sheet.getRow(1);
    HEADER_LABELS.forEach((label, i) => {
        headerRow.getCell(i + 1).value = label;
    });
    applyHeaderStyle(sheet, HEADER_LABELS.length);
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const excelRow = sheet.getRow(r + 2);
        excelRow.getCell(1).value = row.productId;
        excelRow.getCell(2).value = row.konkName;
        excelRow.getCell(3).value = row.prodName;
        excelRow.getCell(4).value = row.title;
        excelRow.getCell(5).value = row.url;
        excelRow.getCell(6).value =
            row.createdAt != null ? formatDateHeader(toSliceDate(row.createdAt)) : "";
        excelRow.getCell(7).value = row.isInvalid ? "так" : "ні";
        applyDataRowStyle(sheet, r + 2, HEADER_LABELS.length);
    }
    for (let c = 1; c <= HEADER_LABELS.length; c++) {
        sheet.getColumn(c).width = 18;
    }
    const buf = await workbook.xlsx.writeBuffer();
    return {
        buffer: Buffer.from(buf),
        fileName: `${fileNameBase}.xlsx`,
    };
}
