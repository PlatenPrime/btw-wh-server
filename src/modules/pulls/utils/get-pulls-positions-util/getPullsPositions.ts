import { IAsk } from "../../../asks/models/Ask.js";
import { IPullPosition } from "../../models/Pull.js";
import { distributeAsksToPositionsUtil } from "./distribute-asks-to-positions-util/distributeAsksToPositionsUtil.js";
import { getAvailablePositionsUtil } from "./getAvailablePositionsUtil.js";

export const getPullsPositions = async (
  asksByArtikul: Map<string, IAsk[]>
): Promise<IPullPosition[]> => {
  const pullPositions: IPullPosition[] = [];
  for (const [artikul, asks] of asksByArtikul) {
    const positions = await getAvailablePositionsUtil(artikul, "pogrebi");

    if (positions.length === 0) {
      continue;
    }

    const artikulPullPositions = distributeAsksToPositionsUtil(asks, positions);
    pullPositions.push(...artikulPullPositions);
  }
  return pullPositions;
};
