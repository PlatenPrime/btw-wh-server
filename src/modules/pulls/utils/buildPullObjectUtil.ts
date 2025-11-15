import { Types } from "mongoose";
import { IPos } from "../../poses/models/Pos.js";
import { IPull, IPullPosition } from "../models/Pull.js";
import { getPositionSectorUtil } from "../../poses/utils/sort-positions-by-pallet-sector-util/getPositionSector.js";

/**
 * Builds a pull object from positions for a specific pallet
 *
 * @param palletId - ID of the pallet
 * @param positions - Array of pull positions for this pallet
 * @returns Promise<IPull | null> - Built pull object or null if position not found
 */
export const buildPullObjectUtil = (
  palletId: Types.ObjectId,
  positions: IPullPosition[],
  positionsLookup: Map<string, IPos>
): IPull | null => {
  if (positions.length === 0) {
    return null;
  }

  const firstPosition = positions[0];
  const originalPosition = positionsLookup.get(firstPosition.posId.toString());

  if (!originalPosition) {
    console.warn(
      `Position ${firstPosition.posId} not found when building pull object for pallet ${palletId}`
    );
    return null;
  }

  // Count unique asks
  const uniqueAskIds = new Set(positions.map((p) => p.askId.toString()));

  const pull: IPull = {
    palletId,
    palletTitle: originalPosition.palletTitle,
    sector: getPositionSectorUtil(originalPosition),
    rowTitle: originalPosition.rowTitle,
    positions,
    totalAsks: uniqueAskIds.size,
  };

  return pull;
};
