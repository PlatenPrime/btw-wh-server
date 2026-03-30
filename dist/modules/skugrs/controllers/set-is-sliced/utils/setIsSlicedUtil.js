import { Skugr } from "../../../models/Skugr.js";
export const setIsSlicedUtil = async () => {
    const result = await Skugr.updateMany({ isSliced: { $exists: false } }, { $set: { isSliced: true } }, { runValidators: true });
    return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
};
