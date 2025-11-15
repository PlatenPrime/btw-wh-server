import { Types } from "mongoose";
import { buildPullObjectUtil } from "../../../utils/buildPullObjectUtil.js";
import { getNewAsksUtil } from "../../../utils/get-new-asks-util/getNewAsksUtil.js";
import { getPullsPositions } from "../../../utils/get-pulls-positions-util/getPullsPositions.js";
import { groupAsksByArtikulUtil } from "../../../utils/group-asks-by-artikul-util/groupAsksByArtikulUtil.js";
import { groupPullPositionsByPalletUtil, } from "../../../utils/groupPullPositionsByPalletUtil.js";
/**
 * Calculates pulls dynamically based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 *
 * @returns Promise<IPullsResponse> - Calculated pulls with metadata
 */
export const calculatePullsUtil = async () => {
    try {
        const pendingAsks = await getNewAsksUtil();
        if (pendingAsks.length === 0) {
            return {
                pulls: [],
                totalPulls: 0,
                totalAsks: 0,
            };
        }
        const asksByArtikul = groupAsksByArtikulUtil(pendingAsks);
        const pullPositions = await getPullsPositions(asksByArtikul);
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
