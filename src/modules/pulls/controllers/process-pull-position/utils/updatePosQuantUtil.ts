import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
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
export const updatePosQuantAndBoxesUtil = async (
  posId: Types.ObjectId,
  newQuant: number,
  newBoxes: number,
  session: ClientSession
): Promise<void> => {
  // Use atomic update to ensure consistency
  // This prevents race conditions when multiple users try to process the same position
  await Pos.findByIdAndUpdate(
    posId,
    { quant: newQuant, boxes: newBoxes },
    { session }
  );
};
