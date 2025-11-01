import mongoose from "mongoose";
import { Pos } from "../../../models/Pos.js";
/**
 * Получает позицию по ID
 */
export const getPosByIdUtil = async (posId) => {
    if (!mongoose.Types.ObjectId.isValid(posId)) {
        throw new Error("Invalid position ID");
    }
    const pos = await Pos.findById(posId);
    return pos;
};
