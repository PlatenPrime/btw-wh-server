import { Pallet } from "../../models/Pallet.js";
import { sortPalletsByTitle } from "../../utils/sortPalletsByTitle.js";
export const getAllPalletsController = async (req, res) => {
    try {
        const pallets = await Pallet.find();
        if (!pallets || pallets.length === 0) {
            res.status(200).json([]);
            return;
        }
        const sortedPallets = sortPalletsByTitle(pallets);
        res.status(200).json(sortedPallets);
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : error,
            });
        }
    }
};
