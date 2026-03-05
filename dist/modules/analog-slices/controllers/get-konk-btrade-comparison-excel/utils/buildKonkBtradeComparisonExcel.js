import ExcelJS from "exceljs";
import { buildAnalogBtradeExcelBlock, setupAnalogBtradeHeaderRow, } from "../../common/buildAnalogBtradeExcelBlock.js";
export async function buildKonkBtradeComparisonExcel(analogs, options) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Порівняння");
    const firstItems = analogs[0]?.items ?? [];
    const dataStartCol = 6;
    const diffCol = dataStartCol + firstItems.length;
    const diffPctCol = diffCol + 1;
    const summaryDiffCol = diffPctCol + 1;
    const summaryDiffPctCol = summaryDiffCol + 1;
    const columnCount = firstItems.length + 9;
    if (columnCount > 0) {
        setupAnalogBtradeHeaderRow(worksheet, firstItems, dataStartCol, diffCol, diffPctCol, summaryDiffCol, summaryDiffPctCol, columnCount);
        const sortedAnalogs = analogs
            .slice()
            .sort((a, b) => a.artikul.localeCompare(b.artikul));
        let startRow = 2;
        for (const analog of sortedAnalogs) {
            buildAnalogBtradeExcelBlock({
                worksheet,
                startRow,
                dataStartCol,
                diffCol,
                diffPctCol,
                summaryDiffCol,
                summaryDiffPctCol,
                columnCount,
                items: analog.items,
                artikul: analog.artikul,
                artNameUkr: analog.artNameUkr,
                producerName: analog.producerName,
                competitorTitle: analog.competitorTitle,
            });
            startRow += 4;
        }
        for (let c = 1; c <= columnCount; c++) {
            worksheet.getColumn(c).width = 14;
        }
    }
    const safeKonk = options.konk.replace(/\s+/g, "_");
    const safeProd = options.prod.replace(/\s+/g, "_");
    const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
    const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
    const fileName = `konk_btrade_comparison_${safeKonk}_${safeProd}_${fromStr}_${toStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), fileName };
}
