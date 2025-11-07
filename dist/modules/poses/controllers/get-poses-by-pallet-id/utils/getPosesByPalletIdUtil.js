import mongoose from "mongoose";
import { Pos } from "../../../models/Pos.js";
/**
 * Получает позиции по ID паллета с возможностью сортировки
 * @param palletId - ID паллета
 * @param sortBy - Поле для сортировки: 'artikul' или 'updatedAt' (по умолчанию 'updatedAt')
 * @param sortOrder - Направление сортировки: 'asc' или 'desc' (по умолчанию 'desc')
 * @returns Массив позиций
 */
export const getPosesByPalletIdUtil = async (palletId, sortBy = "updatedAt", sortOrder = "desc") => {
    if (!mongoose.Types.ObjectId.isValid(palletId)) {
        throw new Error("Invalid pallet ID");
    }
    // Определяем направление сортировки
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    // Формируем объект сортировки
    const sortOptions = {};
    sortOptions[sortBy] = sortDirection;
    const poses = await Pos.find({ "palletData._id": palletId }).sort(sortOptions);
    return poses;
};
