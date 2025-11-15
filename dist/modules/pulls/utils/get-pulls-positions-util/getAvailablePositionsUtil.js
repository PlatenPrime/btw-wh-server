import { Pos } from "../../../poses/models/Pos.js";
/**
 * Gets available positions for a specific artikul
 * Only returns positions with quant > 0 and sklad = "pogrebi"
 *
 * @param artikul - Article identifier
 * @returns Promise<IPos[]> - Array of available positions
 */
export const getAvailablePositionsUtil = async (artikul, sklad = "pogrebi") => {
    const positions = await Pos.find({
        artikul,
        quant: { $gt: 0 },
        sklad,
    }).lean();
    return positions;
};
