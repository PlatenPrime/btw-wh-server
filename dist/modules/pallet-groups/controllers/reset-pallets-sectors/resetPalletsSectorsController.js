import { Pallet } from "../../../pallets/models/Pallet.js";
export const resetPalletsSectorsController = async (req, res) => {
    try {
        const result = await Pallet.updateMany({}, {
            $set: { sector: 0 },
            $unset: { palgr: "" },
        });
        return res.status(200).json({
            message: "Pallets sectors reset successfully",
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to reset pallets sectors",
        });
    }
};
