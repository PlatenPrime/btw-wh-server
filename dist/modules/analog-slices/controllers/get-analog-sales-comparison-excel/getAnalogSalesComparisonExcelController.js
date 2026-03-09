import { getAnalogBtradeComparisonRangeUtil } from "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";
import { getAnalogSalesComparisonExcelSchema } from "./schemas/getAnalogSalesComparisonExcelSchema.js";
import { buildAnalogSalesComparisonExcel } from "./utils/buildAnalogSalesComparisonExcel.js";
/**
 * @desc    Экспорт сравнения продаж по аналогу и Btrade в Excel за период
 * @route   GET /api/analog-slices/analog/:analogId/sales-comparison-excel?dateFrom=...&dateTo=...
 */
export const getAnalogSalesComparisonExcelController = async (req, res) => {
    const parseResult = getAnalogSalesComparisonExcelSchema.safeParse({
        analogId: req.params.analogId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const rangeResult = await getAnalogBtradeComparisonRangeUtil(parseResult.data);
    if (!rangeResult.ok) {
        res.status(404).json({
            message: "Analog not found or analog has no artikul",
        });
        return;
    }
    const { buffer, fileName } = await buildAnalogSalesComparisonExcel(rangeResult.data, {
        artikul: rangeResult.artikul,
        artNameUkr: rangeResult.artNameUkr,
        producerName: rangeResult.producerName,
        competitorTitle: rangeResult.competitorTitle,
        dateFrom: parseResult.data.dateFrom,
        dateTo: parseResult.data.dateTo,
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
