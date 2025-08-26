import { Pallet } from "../models/Pallet.js";
import { sortPalletsByTitle } from "../utils/sortPalletsByTitle.js";
export const getEmptyPallets = async (req, res) => {
    try {
        const pallets = await Pallet.find({
            $or: [{ poses: { $exists: false } }, { poses: { $size: 0 } }],
        });
        if (!pallets || pallets.length === 0) {
            return res.status(404).json({ message: "Empty pallets not found" });
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
