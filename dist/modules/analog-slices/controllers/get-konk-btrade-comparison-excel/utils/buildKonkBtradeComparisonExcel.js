import ExcelJS from "exceljs";
import { buildAnalogBtradeExcelBlock, buildAnalogBtradeTotalBlock, setupAnalogBtradeHeaderRow, } from "../../common/buildAnalogBtradeExcelBlock.js";
export async function buildKonkBtradeComparisonExcel(analogs, options) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Порівняння");
    const firstItems = analogs[0]?.items ?? [];
    const dataStartCol = 7;
    const diffCol = dataStartCol + firstItems.length;
    const diffPctCol = diffCol + 1;
    const summaryDiffCol = diffPctCol + 1;
    const summaryDiffPctCol = summaryDiffCol + 1;
    const columnCount = firstItems.length + 10;
    if (columnCount > 0) {
        setupAnalogBtradeHeaderRow(worksheet, firstItems, dataStartCol, diffCol, diffPctCol, summaryDiffCol, summaryDiffPctCol, columnCount);
        const sortedAnalogs = analogs
            .slice()
            .sort((a, b) => a.artikul.localeCompare(b.artikul));
        let startRow = 2;
        let sumDeltaAnalog = 0;
        let sumDeltaBtrade = 0;
        for (const analog of sortedAnalogs) {
            const deltas = buildAnalogBtradeExcelBlock({
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
                artAbc: analog.artAbc,
                producerName: analog.producerName,
                competitorTitle: analog.competitorTitle,
            });
            if (deltas) {
                sumDeltaAnalog += deltas.deltaAnalog;
                sumDeltaBtrade += deltas.deltaBtrade;
            }
            startRow += 4;
        }
        buildAnalogBtradeTotalBlock({
            worksheet,
            totalStartRow: startRow,
            diffCol,
            summaryDiffCol,
            summaryDiffPctCol,
            columnCount,
            sumDeltaAnalog,
            sumDeltaBtrade,
            competitorTitle: sortedAnalogs[0]?.competitorTitle,
            producerName: sortedAnalogs[0]?.producerName,
        });
        for (let c = 1; c <= columnCount; c++) {
            worksheet.getColumn(c).width = 14;
        }
    }
    const safeKonk = options.konk.replace(/\s+/g, "_");
    const safeProd = options.prod.replace(/\s+/g, "_");
    const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
    const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
    // const fileName = `Порівняльний_зріз_аналогів_та_Btrade_${safeKonk}_${safeProd}_${fromStr}_${toStr}.xlsx`;
    const fileName = `konk_btrade_comparison_${safeKonk}_${safeProd}_${fromStr}_${toStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), fileName };
}
