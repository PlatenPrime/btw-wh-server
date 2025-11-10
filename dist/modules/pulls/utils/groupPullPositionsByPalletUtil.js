import { Types } from "mongoose";
import { Pos } from "../../poses/models/Pos.js";
const buildPositionsLookup = async (pullPositions) => {
    if (pullPositions.length === 0) {
        return new Map();
    }
    const uniqueIds = Array.from(new Set(pullPositions.map((position) => position.posId.toString()))).map((id) => new Types.ObjectId(id));
    const positions = await Pos.find({ _id: { $in: uniqueIds } }).lean();
    const lookup = new Map();
    for (const position of positions) {
        lookup.set(position._id.toString(), position);
    }
    return lookup;
};
/**
 * Groups pull positions by palletId
 * Fetches position data in batch to provide pallet metadata
 */
export const groupPullPositionsByPalletUtil = async (pullPositions) => {
    const pullsByPallet = new Map();
    const positionsLookup = await buildPositionsLookup(pullPositions);
    for (const pullPosition of pullPositions) {
        const originalPosition = positionsLookup.get(pullPosition.posId.toString());
        if (!originalPosition) {
            console.warn(`Position ${pullPosition.posId} not found when grouping by pallet. Skipping.`);
            continue;
        }
        const palletId = originalPosition.pallet.toString();
        if (!pullsByPallet.has(palletId)) {
            pullsByPallet.set(palletId, []);
        }
        pullsByPallet.get(palletId).push(pullPosition);
    }
    return { pullsByPallet, positionsLookup };
};
