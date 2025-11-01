import mongoose from "mongoose";
import { Pos } from "../../../models/Pos.js";
/**
 * Получает позиции по ID ряда
 */
export const getPosesByRowIdUtil = async (rowId) => {
    if (!mongoose.Types.ObjectId.isValid(rowId)) {
        throw new Error("Invalid row ID");
    }
    const poses = await Pos.find({ "rowData._id": rowId }).sort({
        artikul: 1,
    });
    return poses;
};
