import { Pallet } from "../models/Pallet.js";
import { sortPalletsByTitle } from "../utils/sortPalletsByTitle.js";
/**
 * Get all pallets by rowId
 * @param req Express request with rowId param
 * @param res Express response
 */
export const getAllPalletsByRowId = async (req, res) => {
    const { rowId } = req.params || {};
    if (!rowId) {
        return res.status(400).json({ message: "Missing rowId parameter" });
    }
    try {
        const pallets = await Pallet.find({
            "rowData._id": rowId,
        });
        if (!pallets) {
            return res.status(404).json({ message: "Pallets not found" });
        }
        const sortedPallets = sortPalletsByTitle(pallets);
        return res.status(200).json(sortedPallets);
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error instanceof Error ? error.message : error,
        });
    }
};
