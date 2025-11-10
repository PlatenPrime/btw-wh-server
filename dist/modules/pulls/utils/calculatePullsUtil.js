import { Types } from "mongoose";
import { buildPullObjectUtil } from "./buildPullObjectUtil.js";
import { distributeAsksToPositionsUtil } from "./distributeAsksToPositionsUtil.js";
import { getAvailablePositionsUtil } from "./getAvailablePositionsUtil.js";
import { getNewAsksUtil } from "./getNewAsksUtil.js";
import { groupAsksByArtikulUtil } from "./groupAsksByArtikulUtil.js";
import { groupPullPositionsByPalletUtil, } from "./groupPullPositionsByPalletUtil.js";
/**
 * Calculates pulls dynamically based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 *
 * @returns Promise<IPullsResponse> - Calculated pulls with metadata
 */
export const calculatePullsUtil = async () => {
    try {
        // 1. Get all asks with "new" status
        const pendingAsks = await getNewAsksUtil();
        if (pendingAsks.length === 0) {
            return {
                pulls: [],
                totalPulls: 0,
                totalAsks: 0,
            };
        }
        // 2. Group asks by artikul
        const asksByArtikul = groupAsksByArtikulUtil(pendingAsks);
        // 3. Process each artikul group
        const pullPositions = [];
        for (const [artikul, asks] of asksByArtikul) {
            // Find available positions (not empty, only from pogrebi)
            const positions = await getAvailablePositionsUtil(artikul);
            if (positions.length === 0) {
                continue;
            }
            const artikulPullPositions = distributeAsksToPositionsUtil(asks, positions);
            pullPositions.push(...artikulPullPositions);
        }
        if (pullPositions.length === 0) {
            return {
                pulls: [],
                totalPulls: 0,
                totalAsks: pendingAsks.length,
            };
        }
        // 4. Group pull positions by palletId and collect metadata
        const { pullsByPallet, positionsLookup } = await groupPullPositionsByPalletUtil(pullPositions);
        // 5. Create IPull objects
        const pulls = [];
        for (const [palletIdStr, positions] of pullsByPallet) {
            const palletId = new Types.ObjectId(palletIdStr);
            const pull = buildPullObjectUtil(palletId, positions, positionsLookup);
            if (pull) {
                pulls.push(pull);
            }
        }
        // 6. Sort pulls by sector (ASC)
        pulls.sort((a, b) => a.sector - b.sector);
        return {
            pulls,
            totalPulls: pulls.length,
            totalAsks: pendingAsks.length,
        };
    }
    catch (error) {
        console.error("Error calculating pulls:", error);
        throw new Error("Failed to calculate pulls");
    }
};
