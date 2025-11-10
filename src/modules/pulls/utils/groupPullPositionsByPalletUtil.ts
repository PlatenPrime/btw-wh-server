import { Types } from "mongoose";
import { IPos } from "../../poses/models/Pos.js";
import { IPullPosition } from "../models/Pull.js";
import { Pos } from "../../poses/models/Pos.js";

export interface GroupedPullPositions {
  pullsByPallet: Map<string, IPullPosition[]>;
  positionsLookup: Map<string, IPos>;
}

const buildPositionsLookup = async (
  pullPositions: IPullPosition[]
): Promise<Map<string, IPos>> => {
  if (pullPositions.length === 0) {
    return new Map();
  }

  const uniqueIds = Array.from(
    new Set(pullPositions.map((position) => position.posId.toString()))
  ).map((id) => new Types.ObjectId(id));

  const positions = await Pos.find({ _id: { $in: uniqueIds } }).lean();
  const lookup = new Map<string, IPos>();

  for (const position of positions) {
    lookup.set(position._id.toString(), position as IPos);
  }

  return lookup;
};

/**
 * Groups pull positions by palletId
 * Fetches position data in batch to provide pallet metadata
 */
export const groupPullPositionsByPalletUtil = async (
  pullPositions: IPullPosition[]
): Promise<GroupedPullPositions> => {
  const pullsByPallet = new Map<string, IPullPosition[]>();
  const positionsLookup = await buildPositionsLookup(pullPositions);

  for (const pullPosition of pullPositions) {
    const originalPosition = positionsLookup.get(
      pullPosition.posId.toString()
    );

    if (!originalPosition) {
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

  return { pullsByPallet, positionsLookup };
};
