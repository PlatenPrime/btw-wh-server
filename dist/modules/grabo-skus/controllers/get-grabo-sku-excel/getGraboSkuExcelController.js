import { getGraboSkuExcelUtil } from "./utils/getGraboSkuExcelUtil.js";
/**
 * @desc    Excel всех GraboSku, заголовки = поля модели без _id
 * @route   GET /api/grabo-skus/excel
 */
export const getGraboSkuExcelController = async (_req, res) => {
    const { buffer, fileName } = await getGraboSkuExcelUtil();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
