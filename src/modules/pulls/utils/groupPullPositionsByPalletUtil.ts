import { Types } from "mongoose";
import { IPos } from "../../poses/models/Pos.js";
import { IPullPosition } from "../models/Pull.js";
import { Pos } from "../../poses/models/Pos.js";

/**
 * Groups pull positions by palletId
 * Fetches position data to get pallet information
 *
 * @param pullPositions - Array of pull positions to group
 * @returns Promise<Map<string, IPullPosition[]>> - Map of palletId to positions array
 */
export const groupPullPositionsByPalletUtil = async (
  pullPositions: IPullPosition[]
): Promise<Map<string, IPullPosition[]>> => {
  const pullsByPallet = new Map<string, IPullPosition[]>();

  for (const pullPosition of pullPositions) {
    // Find the original position to get pallet information
    const originalPosition = await Pos.findById(pullPosition.posId).lean();
    if (!originalPosition) {
      // Log warning for missing positions (could be deleted between calculation and processing)
      console.warn(
        `Position ${pullPosition.posId} not found when grouping by pallet. Skipping.`
      );
      continue;
    }

    const palletId = originalPosition.pallet.toString();

    if (!pullsByPallet.has(palletId)) {
      pullsByPallet.set(palletId, []);
    }
    pullsByPallet.get(palletId)!.push(pullPosition);
  }

  return pullsByPallet;
};
