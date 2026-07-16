import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
export const resetPalletsSectorsController = async (req, res) => {
    try {
        const result = await Pallet.updateMany({}, {
            $set: { sector: 0 },
            $unset: { palgr: "" },
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "pallet-groups",
                description: `Скинуто сектори усіх паллет: оновлено ${result.modifiedCount} з ${result.matchedCount}`,
            });
        }
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
