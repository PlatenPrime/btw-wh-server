import { Pallet } from "../models/Pallet.js";
/**
 * Get all pallets by rowId
 * @param req Express request with rowId param
 * @param res Express response
 */
export const getAllPalletsByRowId = async (req, res) => {
    const { rowId } = req.params;
    if (!rowId) {
        return res.status(400).json({ error: "Missing rowId parameter" });
    }
    try {
        const pallets = await Pallet.find({ rowId });
        return res.json(pallets);
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: "Failed to fetch pallets by rowId", details: error });
    }
};
