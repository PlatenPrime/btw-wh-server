import { Pos } from "../../poses/models/Pos.js";
import { getPositionSector } from "./getPositionSector.js";
/**
 * Builds a pull object from positions for a specific pallet
 *
 * @param palletId - ID of the pallet
 * @param positions - Array of pull positions for this pallet
 * @returns Promise<IPull | null> - Built pull object or null if position not found
 */
export const buildPullObjectUtil = async (palletId, positions) => {
    if (positions.length === 0) {
        return null;
    }
    // Get original position data for pallet information
    const firstPosition = positions[0];
    const originalPosition = await Pos.findById(firstPosition.posId).lean();
    if (!originalPosition) {
        console.warn(`Position ${firstPosition.posId} not found when building pull object for pallet ${palletId}`);
        return null;
    }
    // Count unique asks
    const uniqueAskIds = new Set(positions.map((p) => p.askId.toString()));
    const pull = {
        palletId,
        palletTitle: originalPosition.palletTitle,
        sector: getPositionSector(originalPosition),
        rowTitle: originalPosition.rowTitle,
        positions,
        totalAsks: uniqueAskIds.size,
    };
    return pull;
};
