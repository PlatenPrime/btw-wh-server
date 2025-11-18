import { z } from "zod";
import { formatPosesStocksForExcelUtil } from "./utils/formatPosesStocksForExcelUtil.js";
import { generateExcelUtil } from "./utils/generateExcelUtil.js";
import { getPosesStocksForExportUtil } from "./utils/getPosesStocksForExportUtil.js";
const exportBodySchema = z
    .object({
    sklad: z.enum(["merezhi", "pogrebi"]).optional(),
})
    .strict();
/**
 * @desc    Экспортировать остатки позиций в Excel файл
 * @route   POST /api/poses/export-stocks
 * @access  Private (ADMIN)
 */
export const exportPosesStocksToExcelController = async (req, res) => {
    try {
        const parsedBody = exportBodySchema.safeParse(req.body ?? {});
        if (!parsedBody.success) {
            res.status(400).json({
                message: "Неверные данные тела запроса",
                errors: parsedBody.error.flatten(),
            });
            return;
        }
        const { sklad } = parsedBody.data;
        const poses = await getPosesStocksForExportUtil(sklad);
        if (!poses.length) {
            res.status(404).json({
                message: "Нет позиций с остатками для экспорта",
            });
            return;
        }
        const excelData = formatPosesStocksForExcelUtil(poses, {
            selectedSklad: sklad,
        });
        const { buffer, fileName } = generateExcelUtil(excelData, sklad);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Length", buffer.length);
        res.status(200).send(buffer);
    }
    catch (error) {
        console.error("Error exporting poses stocks to Excel:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
