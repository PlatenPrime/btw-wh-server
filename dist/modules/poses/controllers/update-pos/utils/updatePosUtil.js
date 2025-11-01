import { Pos } from "../../../models/Pos.js";
/**
 * Обновляет позицию по ID
 */
export const updatePosUtil = async ({ posId, updateData, session, }) => {
    const updatedPos = await Pos.findByIdAndUpdate(posId, updateData, {
        new: true,
        runValidators: true,
        session,
    });
    if (!updatedPos) {
        throw new Error("Position not found");
    }
    return updatedPos;
};
