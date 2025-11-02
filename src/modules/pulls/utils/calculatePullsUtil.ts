import { Types } from "mongoose";
import { IPull, IPullPosition, IPullsResponse } from "../models/Pull.js";
import { getNewAsksUtil } from "./getNewAsksUtil.js";
import { groupAsksByArtikulUtil } from "./groupAsksByArtikulUtil.js";
import { getAvailablePositionsUtil } from "./getAvailablePositionsUtil.js";
import { distributeAsksToPositionsUtil } from "./distributeAsksToPositionsUtil.js";
import { groupPullPositionsByPalletUtil } from "./groupPullPositionsByPalletUtil.js";
import { buildPullObjectUtil } from "./buildPullObjectUtil.js";

/**
 * Calculates pulls dynamically based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 *
 * @returns Promise<IPullsResponse> - Calculated pulls with metadata
 */
export const calculatePullsUtil = async (): Promise<IPullsResponse> => {
  try {
    // 1. Get all asks with "new" status
    const newAsks = await getNewAsksUtil();

    if (newAsks.length === 0) {
      return {
        pulls: [],
        totalPulls: 0,
        totalAsks: 0,
      };
    }

    // 2. Group asks by artikul
    const asksByArtikul = groupAsksByArtikulUtil(newAsks);

    // 3. Process each artikul group
    const pullPositions: IPullPosition[] = [];

    for (const [artikul, asks] of asksByArtikul) {
      // Find available positions (not empty, only from pogrebi)
      const positions = await getAvailablePositionsUtil(artikul);

      if (positions.length === 0) {
        continue; // Skip if no suitable positions found
      }

      // Distribute asks to positions
      const artikulPullPositions = distributeAsksToPositionsUtil(asks, positions);
      pullPositions.push(...artikulPullPositions);
    }

    // 4. Group pull positions by palletId
    const pullsByPallet = await groupPullPositionsByPalletUtil(pullPositions);

    // 5. Create IPull objects
    const pulls: IPull[] = [];

    for (const [palletIdStr, positions] of pullsByPallet) {
      const palletId = new Types.ObjectId(palletIdStr);
      const pull = await buildPullObjectUtil(palletId, positions);

      if (pull) {
        pulls.push(pull);
      }
    }

    // 6. Sort pulls by sector (ASC)
    pulls.sort((a, b) => a.sector - b.sector);

    return {
      pulls,
      totalPulls: pulls.length,
      totalAsks: newAsks.length,
    };
  } catch (error) {
    console.error("Error calculating pulls:", error);
    throw new Error("Failed to calculate pulls");
  }
};

/**
 * Calculates pulls for a specific pallet
 *
 * @param palletId - ID of the pallet to calculate pulls for
 * @returns Promise<IPull | null> - Pull for the specified pallet or null if not found
 */
export const calculatePullByPalletIdUtil = async (
  palletId: Types.ObjectId
): Promise<IPull | null> => {
  try {
    const allPulls = await calculatePullsUtil();
    return (
      allPulls.pulls.find(
        (pull) => pull.palletId.toString() === palletId.toString()
      ) || null
    );
  } catch (error) {
    console.error("Error calculating pull by pallet ID:", error);
    throw new Error("Failed to calculate pull by pallet ID");
  }
};
