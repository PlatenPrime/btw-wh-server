import ExcelJS from "exceljs";
import { buildSalesComparisonExcelBlock, buildSalesComparisonSummaryBlock, setupSalesComparisonHeaderRow, } from "../../common/buildSalesComparisonExcelBlock.js";
export async function buildSalesComparisonExcel(analogs, options) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Порівняння");
    const firstItems = analogs[0]?.items ?? [];
    const dataStartCol = 7;
    const totalCol = dataStartCol + firstItems.length;
    const diffSalesCol = totalCol + 1;
    const diffSalesPctCol = totalCol + 2;
    const diffRevenueCol = totalCol + 3;
    const diffRevenuePctCol = totalCol + 4;
    const columnCount = diffRevenuePctCol;
    if (columnCount > 0 && firstItems.length > 0) {
        setupSalesComparisonHeaderRow({
            worksheet,
            items: firstItems,
            dataStartCol,
            totalCol,
            diffSalesCol,
            diffSalesPctCol,
            diffRevenueCol,
            diffRevenuePctCol,
            columnCount,
        });
        const sortedAnalogs = analogs
            .slice()
            .sort((a, b) => a.artikul.localeCompare(b.artikul));
        let startRow = 2;
        let sumAnalogSales = 0;
        let sumAnalogRevenue = 0;
        let sumBtradeSales = 0;
        let sumBtradeRevenue = 0;
        for (const analog of sortedAnalogs) {
            const totals = buildSalesComparisonExcelBlock({
                worksheet,
                startRow,
                dataStartCol,
                totalCol,
                diffSalesCol,
                diffSalesPctCol,
                diffRevenueCol,
                diffRevenuePctCol,
                columnCount,
                items: analog.items,
                artikul: analog.artikul,
                artNameUkr: analog.artNameUkr,
                artAbc: analog.artAbc,
                producerName: analog.producerName,
                competitorTitle: analog.competitorTitle,
            });
            sumAnalogSales += totals.totalAnalogSales;
            sumAnalogRevenue += totals.totalAnalogRevenue;
            sumBtradeSales += totals.totalBtradeSales;
            sumBtradeRevenue += totals.totalBtradeRevenue;
            startRow += 6;
        }
        const summaryStartRow = startRow + 1;
        buildSalesComparisonSummaryBlock({
            worksheet,
            startRow: summaryStartRow,
            keyCol: 1,
            valueCol: 2,
            totalAnalogSales: sumAnalogSales,
            totalAnalogRevenue: sumAnalogRevenue,
            totalBtradeSales: sumBtradeSales,
            totalBtradeRevenue: sumBtradeRevenue,
        });
        for (let c = 1; c <= columnCount; c++) {
            worksheet.getColumn(c).width = 14;
        }
    }
    const safeKonk = options.konk.replace(/\s+/g, "_");
    const safeProd = options.prod.replace(/\s+/g, "_");
    const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
    const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
    const fileName = `sales_comparison_${safeKonk}_${safeProd}_${fromStr}_${toStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), fileName };
}
