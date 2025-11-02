import { Pos } from "../../../../poses/models/Pos.js";
/**
 * Updates position quantity after processing
 * Uses atomic update to prevent race conditions when multiple users process the same position
 *
 * @param posId - ID of the position to update
 * @param newQuant - New quantity value
 * @param session - MongoDB session for transaction
 */
export const updatePosQuantUtil = async (posId, newQuant, session) => {
    // Use atomic update to ensure consistency
    // This prevents race conditions when multiple users try to process the same position
    await Pos.findByIdAndUpdate(posId, { quant: newQuant }, { session });
};
