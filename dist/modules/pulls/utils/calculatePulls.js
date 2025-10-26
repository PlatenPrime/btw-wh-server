import { Types } from "mongoose";
import { Ask } from "../../asks/models/Ask.js";
import { Pos } from "../../poses/models/Pos.js";
import { getPositionSector, sortPositionsBySector, } from "./sortPositionsBySector.js";
/**
 * Calculates pulls dynamically based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 *
 * @returns Promise<IPullsResponse> - Calculated pulls with metadata
 */
export const calculatePulls = async () => {
    try {
        // 1. Get all asks with "new" status
        const newAsks = await Ask.find({ status: "new" }).lean();
        if (newAsks.length === 0) {
            return {
                pulls: [],
                totalPulls: 0,
                totalAsks: 0,
            };
        }
        // 2. Group asks by artikul
        const asksByArtikul = new Map();
        for (const ask of newAsks) {
            if (!asksByArtikul.has(ask.artikul)) {
                asksByArtikul.set(ask.artikul, []);
            }
            asksByArtikul.get(ask.artikul).push(ask);
        }
        // 3. Process each artikul group
        const pullPositions = [];
        for (const [artikul, asks] of asksByArtikul) {
            // Find all positions for this artikul
            const positions = await Pos.find({ artikul }).lean();
            if (positions.length === 0) {
                continue; // Skip if no positions found
            }
            // Sort positions by sector (ASC)
            const sortedPositions = sortPositionsBySector(positions);
            // 4. Distribute asks across positions using greedy algorithm
            let positionIndex = 0;
            for (const ask of asks) {
                const requestedQuant = ask.quant || 0;
                let remainingQuant = requestedQuant;
                // Try to fulfill the ask from available positions
                while (remainingQuant > 0 && positionIndex < sortedPositions.length) {
                    const position = sortedPositions[positionIndex];
                    const availableQuant = position.quant;
                    if (availableQuant > 0) {
                        const quantToTake = Math.min(remainingQuant, availableQuant);
                        // Create pull position
                        const pullPosition = {
                            posId: position._id,
                            artikul: position.artikul,
                            nameukr: position.nameukr,
                            currentQuant: availableQuant,
                            requestedQuant: quantToTake,
                            askId: ask._id,
                            askerData: ask.askerData,
                        };
                        pullPositions.push(pullPosition);
                        remainingQuant -= quantToTake;
                    }
                    positionIndex++;
                }
                // Reset position index for next ask
                positionIndex = 0;
            }
        }
        // 5. Group pull positions by palletId
        const pullsByPallet = new Map();
        for (const pullPosition of pullPositions) {
            // Find the original position to get pallet information
            const originalPosition = await Pos.findById(pullPosition.posId).lean();
            if (!originalPosition)
                continue;
            const palletId = originalPosition.pallet.toString();
            if (!pullsByPallet.has(palletId)) {
                pullsByPallet.set(palletId, []);
            }
            pullsByPallet.get(palletId).push(pullPosition);
        }
        // 6. Create IPull objects
        const pulls = [];
        for (const [palletIdStr, positions] of pullsByPallet) {
            if (positions.length === 0)
                continue;
            // Get pallet data from first position
            const firstPosition = positions[0];
            const palletId = new Types.ObjectId(palletIdStr);
            // Get original position data for pallet information
            const originalPosition = await Pos.findById(firstPosition.posId).lean();
            if (!originalPosition)
                continue;
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
            pulls.push(pull);
        }
        // 7. Sort pulls by sector (ASC)
        pulls.sort((a, b) => a.sector - b.sector);
        return {
            pulls,
            totalPulls: pulls.length,
            totalAsks: newAsks.length,
        };
    }
    catch (error) {
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
export const calculatePullByPalletId = async (palletId) => {
    try {
        const allPulls = await calculatePulls();
        return (allPulls.pulls.find((pull) => pull.palletId.toString() === palletId.toString()) || null);
    }
    catch (error) {
        console.error("Error calculating pull by pallet ID:", error);
        throw new Error("Failed to calculate pull by pallet ID");
    }
};
