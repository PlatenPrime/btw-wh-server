import { Pos } from "../../../../poses/models/Pos.js";
/**
 * Updates position quantity and boxes after processing
 * Uses atomic update to prevent race conditions when multiple users process the same position
 *
 * @param posId - ID of the position to update
 * @param newQuant - New quantity value
 * @param newBoxes - New boxes value
 * @param session - MongoDB session for transaction
 */
export const updatePosQuantAndBoxesUtil = async (posId, newQuant, newBoxes, session) => {
    // Use atomic update to ensure consistency
    // This prevents race conditions when multiple users try to process the same position
    await Pos.findByIdAndUpdate(posId, { quant: newQuant, boxes: newBoxes }, { session });
};
