import { getAnalogBtradeComparisonExcelSchema } from "./schemas/getAnalogBtradeComparisonExcelSchema.js";
import { buildAnalogBtradeComparisonExcel } from "./utils/buildAnalogBtradeComparisonExcel.js";
import { getAnalogBtradeComparisonRangeUtil } from "./utils/getAnalogBtradeComparisonRangeUtil.js";
/**
 * @desc    Экспорт сравнительных срезов по аналогу и Btrade в Excel за период дат
 * @route   GET /api/analog-slices/analog/:analogId/comparison-excel?dateFrom=2026-03-01&dateTo=2026-03-31
 */
export const getAnalogBtradeComparisonExcelController = async (req, res) => {
    const parseResult = getAnalogBtradeComparisonExcelSchema.safeParse({
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
    const { buffer, fileName } = await buildAnalogBtradeComparisonExcel(rangeResult.data, {
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
