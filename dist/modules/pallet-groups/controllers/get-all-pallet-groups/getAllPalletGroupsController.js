import { PalletGroup } from "../../models/PalletGroup.js";
export const getAllPalletGroupsController = async (req, res) => {
    try {
        const groups = await PalletGroup.find({}).sort({ order: 1 }).exec();
        return res.status(200).json({
            message: "Pallet groups fetched successfully",
            data: groups.map((group) => ({
                id: group._id.toString(),
                title: group.title,
                order: group.order,
            })),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to fetch pallet groups",
        });
    }
};
