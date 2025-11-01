import { getAllPosesUtil } from "./utils/getAllPosesUtil.js";
export const getAllPosesController = async (req, res) => {
    try {
        const { page = "1", limit = "20", rowId, palletId, rowTitle, palletTitle, artikul, nameukr, sklad, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        // 1. Получаем позиции через утилиту
        const result = await getAllPosesUtil({
            filter: {
                rowId: rowId,
                palletId: palletId,
                rowTitle: rowTitle,
                palletTitle: palletTitle,
                artikul: artikul,
                nameukr: nameukr,
                sklad: sklad,
            },
            page: pageNum,
            limit: limitNum,
        });
        // 2. HTTP ответ
        res.status(200).json(result);
    }
    catch (error) {
        // 3. Обработка ошибок
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to fetch poses", details: error });
        }
    }
};
