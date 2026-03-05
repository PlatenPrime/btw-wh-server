import { getKonkBtradeComparisonExcelSchema } from "./schemas/getKonkBtradeComparisonExcelSchema.js";
import { getKonkBtradeComparisonRangeUtil } from "./utils/getKonkBtradeComparisonRangeUtil.js";
import { buildKonkBtradeComparisonExcel } from "./utils/buildKonkBtradeComparisonExcel.js";
/**
 * @desc    Экспорт сравнительных срезов по группе аналогов (конкурент + производитель) и Btrade в Excel за период дат
 * @route   GET /api/analog-slices/konk-btrade/comparison-excel?konk=air&prod=gemar&dateFrom=2026-03-01&dateTo=2026-03-31
 */
export const getKonkBtradeComparisonExcelController = async (req, res) => {
    const parseResult = getKonkBtradeComparisonExcelSchema.safeParse({
        konk: req.query.konk,
        prod: req.query.prod,
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
    const rangeResult = await getKonkBtradeComparisonRangeUtil(parseResult.data);
    if (!rangeResult.ok) {
        res.status(404).json({
            message: "Analogs not found for provided konk/prod",
        });
        return;
    }
    const { buffer, fileName } = await buildKonkBtradeComparisonExcel(rangeResult.analogs, {
        konk: rangeResult.konk,
        prod: rangeResult.prod,
        dateFrom: rangeResult.dateFrom,
        dateTo: rangeResult.dateTo,
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
