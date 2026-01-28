import { calculatePalletsSectorsUtil } from "../../utils/calculatePalletsSectorsUtil.js";
export const recalculatePalletsSectorsController = async (req, res) => {
    try {
        const result = await calculatePalletsSectorsUtil();
        return res.status(200).json({
            message: "Pallets sectors recalculated successfully",
            data: {
                updatedPallets: result.updatedPallets,
                groupsProcessed: result.groupsProcessed,
                updatedPositions: result.updatedPositions,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to recalculate pallets sectors",
        });
    }
};
