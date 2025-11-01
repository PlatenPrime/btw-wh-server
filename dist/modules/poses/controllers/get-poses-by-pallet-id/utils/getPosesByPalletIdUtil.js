import mongoose from "mongoose";
import { Pos } from "../../../models/Pos.js";
/**
 * Получает позиции по ID паллета
 */
export const getPosesByPalletIdUtil = async (palletId) => {
    if (!mongoose.Types.ObjectId.isValid(palletId)) {
        throw new Error("Invalid pallet ID");
    }
    const poses = await Pos.find({ "palletData._id": palletId }).sort({
        artikul: 1,
    });
    return poses;
};
